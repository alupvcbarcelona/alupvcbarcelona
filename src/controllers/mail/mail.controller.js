const { GMAIL, GOOGLE_CONFIGURED } = require("../../config/oauth.google");
const { sendMail, EMAIL_HOST } = require("../../config/nodemailer");
const SETTINGS_MODEL = require("../../models/settings.model");
const { ESCAPE_HTML, ESCAPE_MULTILINE } = require("../../utils/escape");
const { BRAND } = require("../../emails/layout");

const NOT_CONFIGURED = (res) =>
  res.status(503).json({
    success: false,
    message: "Gmail no está configurado. Revisa OAUTH_CLIENTID, OAUTH_CLIENT_SECRET, OAUTH_REFRESH_TOKEN y EMAIL_HOST.",
  });

const FOLDERS = {
  inbox: ["INBOX"],
  unread: ["INBOX", "UNREAD"],
  sent: ["SENT"],
  starred: ["STARRED"],
  trash: ["TRASH"],
};

const HEADER = (headers = [], name) =>
  headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

const DECODE = (data = "") => Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

// WALK THE MIME TREE: HTML, TEXT AND ATTACHMENTS
const PARSE_PARTS = (payload, result = { html: "", text: "", attachments: [] }) => {
  if (!payload) return result;
  const { mimeType, body, parts, filename } = payload;

  if (filename && body?.attachmentId) {
    result.attachments.push({ filename, mimeType, size: body.size, attachmentId: body.attachmentId });
  } else if (mimeType === "text/html" && body?.data) {
    result.html += DECODE(body.data);
  } else if (mimeType === "text/plain" && body?.data) {
    result.text += DECODE(body.data);
  }
  (parts || []).forEach((part) => PARSE_PARTS(part, result));
  return result;
};

const PARSE_MESSAGE = (message) => {
  const headers = message.payload?.headers || [];
  const content = PARSE_PARTS(message.payload);
  return {
    id: message.id,
    threadId: message.threadId,
    labelIds: message.labelIds || [],
    unread: (message.labelIds || []).includes("UNREAD"),
    from: HEADER(headers, "From"),
    to: HEADER(headers, "To"),
    cc: HEADER(headers, "Cc"),
    replyTo: HEADER(headers, "Reply-To"),
    subject: HEADER(headers, "Subject"),
    date: HEADER(headers, "Date") || new Date(Number(message.internalDate)).toISOString(),
    messageId: HEADER(headers, "Message-ID") || HEADER(headers, "Message-Id"),
    references: HEADER(headers, "References"),
    snippet: message.snippet,
    html: content.html,
    text: content.text,
    attachments: content.attachments,
  };
};

//======================================================
// LIST THREADS (?folder=inbox|unread|sent|starred|trash&q=&pageToken=)
//======================================================
const GET_THREADS = async (req, res) => {
  if (!GOOGLE_CONFIGURED()) return NOT_CONFIGURED(res);
  const folder = FOLDERS[req.query.folder] ? req.query.folder : "inbox";

  const { data } = await GMAIL.users.threads.list({
    userId: "me",
    labelIds: FOLDERS[folder],
    q: req.query.q || undefined,
    maxResults: 25,
    pageToken: req.query.pageToken || undefined,
  });

  const threads = await Promise.all(
    (data.threads || []).map(async ({ id }) => {
      const { data: thread } = await GMAIL.users.threads.get({
        userId: "me",
        id,
        format: "metadata",
        metadataHeaders: ["From", "To", "Subject", "Date"],
      });
      const messages = thread.messages || [];
      const first = messages[0];
      const last = messages[messages.length - 1];
      return {
        id,
        subject: HEADER(first?.payload?.headers, "Subject") || "(sin asunto)",
        from: HEADER(last?.payload?.headers, "From"),
        to: HEADER(last?.payload?.headers, "To"),
        date: new Date(Number(last?.internalDate)).toISOString(),
        snippet: last?.snippet || "",
        count: messages.length,
        unread: messages.some((m) => (m.labelIds || []).includes("UNREAD")),
        starred: messages.some((m) => (m.labelIds || []).includes("STARRED")),
      };
    }),
  );

  const { data: inbox } = await GMAIL.users.labels.get({ userId: "me", id: "INBOX" });

  return res.status(200).json({
    success: true,
    account: EMAIL_HOST,
    unread: inbox.threadsUnread || 0,
    nextPageToken: data.nextPageToken || null,
    data: threads,
  });
};

//======================================================
// GET THREAD (MARKS AS READ)
//======================================================
const GET_THREAD = async (req, res) => {
  if (!GOOGLE_CONFIGURED()) return NOT_CONFIGURED(res);
  const { data } = await GMAIL.users.threads.get({ userId: "me", id: req.params.id, format: "full" });

  if ((data.messages || []).some((m) => (m.labelIds || []).includes("UNREAD"))) {
    await GMAIL.users.threads.modify({ userId: "me", id: req.params.id, requestBody: { removeLabelIds: ["UNREAD"] } });
  }

  return res.status(200).json({
    success: true,
    account: EMAIL_HOST,
    data: { id: data.id, messages: (data.messages || []).map(PARSE_MESSAGE) },
  });
};

//======================================================
// DOWNLOAD ATTACHMENT
//======================================================
const GET_ATTACHMENT = async (req, res) => {
  if (!GOOGLE_CONFIGURED()) return NOT_CONFIGURED(res);
  const { messageId, attachmentId } = req.params;
  const { data } = await GMAIL.users.messages.attachments.get({ userId: "me", messageId, id: attachmentId });
  const buffer = Buffer.from(data.data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  res.setHeader("Content-Type", req.query.type || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(req.query.name || "adjunto")}"`);
  return res.send(buffer);
};

//======================================================
// SEND NEW EMAIL OR REPLY ({ to, cc, subject, body, threadId })
//======================================================
const SEND_EMAIL = async (req, res) => {
  if (!GOOGLE_CONFIGURED()) return NOT_CONFIGURED(res);
  const { to, cc, subject, body, threadId } = req.body;
  if (!to || !String(body || "").trim()) {
    return res.status(400).json({ success: false, message: "Indica destinatario y mensaje." });
  }

  const company = await SETTINGS_MODEL.get();
  let options = { fromName: company.name };
  let finalSubject = subject || "";

  // REPLY: KEEP THE CONVERSATION IN THE SAME THREAD
  if (threadId) {
    const { data } = await GMAIL.users.threads.get({
      userId: "me",
      id: threadId,
      format: "metadata",
      metadataHeaders: ["Subject", "Message-ID", "References"],
    });
    const last = data.messages?.[data.messages.length - 1];
    const headers = last?.payload?.headers || [];
    const messageId = HEADER(headers, "Message-ID");
    const original = HEADER(data.messages?.[0]?.payload?.headers, "Subject");
    finalSubject = finalSubject || (/^re:/i.test(original) ? original : `Re: ${original}`);
    options = {
      ...options,
      threadId,
      inReplyTo: messageId,
      references: [HEADER(headers, "References"), messageId].filter(Boolean).join(" "),
    };
  }

  const html = `<div style="font-family:${BRAND.font};font-size:15px;line-height:1.6;color:${BRAND.ink};">
    ${ESCAPE_MULTILINE(body)}
    <p style="margin-top:24px;font-size:13px;color:${BRAND.muted};">--<br><strong style="color:${BRAND.ink};">${ESCAPE_HTML(company.owner || company.name)}</strong><br>${ESCAPE_HTML(company.name)} · ${ESCAPE_HTML(company.phone)}<br>${ESCAPE_HTML(company.website)}</p>
  </div>`;

  const sent = await sendMail(to, cc ? [cc] : [], finalSubject || "(sin asunto)", html, options);
  if (!sent) return res.status(502).json({ success: false, message: "No se pudo enviar el email." });

  return res.status(200).json({ success: true, message: "Email enviado.", data: sent });
};

//======================================================
// MODIFY THREAD ({ read, starred, archive, trash })
//======================================================
const MODIFY_THREAD = async (req, res) => {
  if (!GOOGLE_CONFIGURED()) return NOT_CONFIGURED(res);
  const { read, starred, archive, trash } = req.body;
  const id = req.params.id;

  if (trash) {
    await GMAIL.users.threads.trash({ userId: "me", id });
    return res.status(200).json({ success: true, message: "Conversación movida a la papelera." });
  }

  const addLabelIds = [];
  const removeLabelIds = [];
  if (read === true) removeLabelIds.push("UNREAD");
  if (read === false) addLabelIds.push("UNREAD");
  if (starred === true) addLabelIds.push("STARRED");
  if (starred === false) removeLabelIds.push("STARRED");
  if (archive) removeLabelIds.push("INBOX");

  await GMAIL.users.threads.modify({ userId: "me", id, requestBody: { addLabelIds, removeLabelIds } });
  return res.status(200).json({ success: true, message: archive ? "Conversación archivada." : "Actualizado." });
};

module.exports = { GET_THREADS, GET_THREAD, GET_ATTACHMENT, SEND_EMAIL, MODIFY_THREAD };
