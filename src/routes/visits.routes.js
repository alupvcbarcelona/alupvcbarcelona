const express = require("express");
const VISIT_ROUTES = express.Router();

const { TRACK_VISIT, GET_STATS, RELOCATE_VISITS } = require("../controllers/visits/visits.controller");
const { isAuth } = require("../middlewares/is-auth.middleware");
const { RATE_LIMIT } = require("../middlewares/rate-limit.middleware");

VISIT_ROUTES.post("/", RATE_LIMIT({ windowMs: 60_000, max: 60 }), TRACK_VISIT);
VISIT_ROUTES.get("/stats", isAuth, GET_STATS); // ?days=30
VISIT_ROUTES.post("/relocate", isAuth, RELOCATE_VISITS); // CORRIGE UBICACIONES GUARDADAS

module.exports = VISIT_ROUTES;
