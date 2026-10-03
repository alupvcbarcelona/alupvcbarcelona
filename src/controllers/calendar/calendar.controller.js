const { CALENDAR, GOOGLE_CONFIGURED } = require("../../config/oauth.google");

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
const TZ = "Europe/Madrid";

// APPOINTMENT TYPES -> GOOGLE CALENDAR COLOR IDS
const TYPES = {
  visita: { label: "Visita", colorId: "9" },
  medicion: { label: "Medición", colorId: "5" },
  instalacion: { label: "Instalación", colorId: "10" },
  reparacion: { label: "Reparación", colorId: "6" },
  otro: { label: "Otro", colorId: "8" },
};

const NOT_CONFIGURED = (res) =>
  res.status(503).json({
    success: false,
    message: "Google Calendar no está configurado. Revisa las credenciales OAuth de Google.",
  });

const TO_EVENT = (event) => ({
  id: event.id,
  summary: event.summary || "(sin título)",
  description: event.description || "",
  location: event.location || "",
  start: event.start?.dateTime || event.start?.date,
  end: event.end?.dateTime || event.end?.date,
  allDay: Boolean(event.start?.date),
  type: event.extendedProperties?.private?.type || "otro",
  messageId: event.extendedProperties?.private?.messageId || null,
  documentId: event.extendedProperties?.private?.documentId || null,
  attendees: (event.attendees || []).map((a) => ({ email: a.email, status: a.responseStatus })),
  htmlLink: event.htmlLink,
});

// BUILD THE GOOGLE EVENT FROM THE FORM
const FROM_BODY = (body) => {
  const type = TYPES[body.type] ? body.type : "otro";
  const event = {
    summary: body.summary,
    description: body.description || "",
    location: body.location || "",
    colorId: TYPES[type].colorId,
    extendedProperties: {
      private: {
        type,
        ...(body.messageId ? { messageId: String(body.messageId) } : {}),
        ...(body.documentId ? { documentId: String(body.documentId) } : {}),
      },
    },
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 60 }, { method: "popup", minutes: 1440 }] },
  };

  if (body.allDay) {
    const start = String(body.start).slice(0, 10);
    const endDate = new Date(String(body.end || body.start).slice(0, 10));
    endDate.setDate(endDate.getDate() + 1); // GOOGLE END DATE IS EXCLUSIVE
    event.start = { date: start };
    event.end = { date: endDate.toISOString().slice(0, 10) };
  } else {
    event.start = { dateTime: new Date(body.start).toISOString(), timeZone: TZ };
    event.end = { dateTime: new Date(body.end || new Date(new Date(body.start).getTime() + 3_600_000)).toISOString(), timeZone: TZ };
  }

  event.attendees = body.attendeeEmail ? [{ email: body.attendeeEmail }] : [];
  return event;
};

const VALIDATE = (body) => {
  if (!body.summary?.trim()) return "El título de la cita es obligatorio.";
  if (!body.start || Number.isNaN(new Date(body.start).getTime())) return "La fecha de inicio no es válida.";
  if (body.end && new Date(body.end) < new Date(body.start)) return "La fecha de fin es anterior al inicio.";
  return null;
};

//======================================================
// LIST EVENTS (?from=ISO&to=ISO)
//======================================================
const GET_EVENTS = async (req, res) => {
  if (!GOOGLE_CONFIGURED()) return NOT_CONFIGURED(res);
  const from = req.query.from ? new Date(req.query.from) : new Date();
  const to = req.query.to ? new Date(req.query.to) : new Date(from.getTime() + 30 * 86_400_000);

  const { data } = await CALENDAR.events.list({
    calendarId: CALENDAR_ID,
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  return res.status(200).json({ success: true, types: TYPES, data: (data.items || []).map(TO_EVENT) });
};

//======================================================
// CREATE EVENT (notify=true SENDS THE INVITATION TO THE CLIENT)
//======================================================
const CREATE_EVENT = async (req, res) => {
  if (!GOOGLE_CONFIGURED()) return NOT_CONFIGURED(res);
  const error = VALIDATE(req.body);
  if (error) return res.status(400).json({ success: false, message: error });

  const { data } = await CALENDAR.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: FROM_BODY(req.body),
    sendUpdates: req.body.notify && req.body.attendeeEmail ? "all" : "none",
  });

  return res.status(201).json({ success: true, message: "Cita creada en Google Calendar.", data: TO_EVENT(data) });
};

//======================================================
// UPDATE EVENT
//======================================================
const UPDATE_EVENT = async (req, res) => {
  if (!GOOGLE_CONFIGURED()) return NOT_CONFIGURED(res);
  const error = VALIDATE(req.body);
  if (error) return res.status(400).json({ success: false, message: error });

  const { data } = await CALENDAR.events.patch({
    calendarId: CALENDAR_ID,
    eventId: req.params.id,
    requestBody: FROM_BODY(req.body),
    sendUpdates: req.body.notify && req.body.attendeeEmail ? "all" : "none",
  });

  return res.status(200).json({ success: true, message: "Cita actualizada.", data: TO_EVENT(data) });
};

//======================================================
// DELETE EVENT
//======================================================
const DELETE_EVENT = async (req, res) => {
  if (!GOOGLE_CONFIGURED()) return NOT_CONFIGURED(res);
  await CALENDAR.events.delete({
    calendarId: CALENDAR_ID,
    eventId: req.params.id,
    sendUpdates: req.query.notify === "true" ? "all" : "none",
  });
  return res.status(200).json({ success: true, message: "Cita eliminada." });
};

module.exports = { GET_EVENTS, CREATE_EVENT, UPDATE_EVENT, DELETE_EVENT, TYPES };
