const express = require("express");
const SETTINGS_ROUTES = express.Router();

const {
  GET_PUBLIC_SETTINGS,
  GET_SETTINGS,
  UPDATE_SETTINGS,
} = require("../controllers/settings/settings.controller");
const { GET_SUMMARY } = require("../controllers/dashboard/dashboard.controller");
const { isAuth } = require("../middlewares/is-auth.middleware");

SETTINGS_ROUTES.get("/public", GET_PUBLIC_SETTINGS);
SETTINGS_ROUTES.get("/", isAuth, GET_SETTINGS);
SETTINGS_ROUTES.put("/", isAuth, UPDATE_SETTINGS);
SETTINGS_ROUTES.get("/dashboard", isAuth, GET_SUMMARY);

module.exports = SETTINGS_ROUTES;
