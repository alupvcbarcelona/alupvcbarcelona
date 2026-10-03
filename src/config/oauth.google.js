const { google } = require("googleapis");

// ----------------------
// GOOGLE OAUTH2 CLIENT (GMAIL + CALENDAR)
// THE REFRESH TOKEN MUST INCLUDE THE SCOPES:
//   https://mail.google.com/
//   https://www.googleapis.com/auth/calendar
// ----------------------
const OAUTH_CLIENTID = process.env.OAUTH_CLIENTID;
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const OAUTH_REFRESH_TOKEN = process.env.OAUTH_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  OAUTH_CLIENTID,
  OAUTH_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground",
);

oauth2Client.setCredentials({ refresh_token: OAUTH_REFRESH_TOKEN });

const GMAIL = google.gmail({ version: "v1", auth: oauth2Client });
const CALENDAR = google.calendar({ version: "v3", auth: oauth2Client });

const GOOGLE_CONFIGURED = () => Boolean(OAUTH_CLIENTID && OAUTH_CLIENT_SECRET && OAUTH_REFRESH_TOKEN);

module.exports = { oauth2Client, GMAIL, CALENDAR, GOOGLE_CONFIGURED };
