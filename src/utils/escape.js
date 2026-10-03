// ESCAPE TEXT BEFORE INSERTING IT IN HTML (EMAILS)
const ESCAPE_HTML = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// ESCAPE AND KEEP LINE BREAKS
const ESCAPE_MULTILINE = (value) => ESCAPE_HTML(value).replace(/\r?\n/g, "<br>");

module.exports = { ESCAPE_HTML, ESCAPE_MULTILINE };
