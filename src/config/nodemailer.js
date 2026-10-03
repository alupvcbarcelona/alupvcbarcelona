// ----------------------
// EMAIL DELIVERY THROUGH THE GMAIL API
// NODEMAILER IS ONLY USED TO BUILD THE MIME MESSAGE (ENCODING, HTML + TEXT)
// ----------------------
const MailComposer = require("nodemailer/lib/mail-composer");
const { GMAIL, GOOGLE_CONFIGURED } = require("./oauth.google");

const EMAIL_HOST = process.env.EMAIL_HOST;

const HTML_TO_TEXT = (html = "") =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h1|h2|h3|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();

// BUILD A BASE64URL RAW MESSAGE FOR gmail.users.messages.send
const BUILD_RAW = async (mail) => {
  const buffer = await new MailComposer(mail).compile().build();
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// ----------------------
// SEND EMAIL. RETURNS THE GMAIL MESSAGE ({ id, threadId }) OR FALSE (NEVER THROWS)
// options: { replyTo, text, fromName, threadId, inReplyTo, references, attachments }
// ----------------------
const sendMail = async (to, cc = [], subject, htmlContent, options = {}) => {
  if (!GOOGLE_CONFIGURED() || !EMAIL_HOST) {
    console.error("Error to send email: Google OAuth / EMAIL_HOST not configured");
    return false;
  }
  try {
    const raw = await BUILD_RAW({
      from: options.fromName ? { name: options.fromName, address: EMAIL_HOST } : EMAIL_HOST,
      to,
      cc: cc?.length ? cc : undefined,
      subject,
      html: htmlContent,
      text: options.text || HTML_TO_TEXT(htmlContent),
      replyTo: options.replyTo,
      inReplyTo: options.inReplyTo,
      references: options.references,
      attachments: options.attachments,
    });

    const { data } = await GMAIL.users.messages.send({
      userId: "me",
      requestBody: { raw, threadId: options.threadId },
    });
    console.log(`Send email to: ${to} (${data.id})`);
    return data;
  } catch (error) {
    console.error(`Error to send email: ${error.message}`);
    return false;
  }
};

module.exports = { sendMail, HTML_TO_TEXT, EMAIL_HOST };
