const express = require("express");
const SERVICE_ROUTES = express.Router();

const {
  GET_PUBLIC_SERVICES,
  GET_SERVICES,
  CREATE_SERVICE,
  UPDATE_SERVICE,
  REORDER_SERVICES,
  DELETE_SERVICE,
} = require("../controllers/services/services.controller");
const { isAuth } = require("../middlewares/is-auth.middleware");

// PUBLIC
SERVICE_ROUTES.get("/", GET_PUBLIC_SERVICES);

// ADMIN
SERVICE_ROUTES.get("/admin/all", isAuth, GET_SERVICES);
SERVICE_ROUTES.post("/", isAuth, CREATE_SERVICE);
SERVICE_ROUTES.put("/reorder", isAuth, REORDER_SERVICES);
SERVICE_ROUTES.put("/:id", isAuth, UPDATE_SERVICE);
SERVICE_ROUTES.delete("/:id", isAuth, DELETE_SERVICE);

module.exports = SERVICE_ROUTES;
