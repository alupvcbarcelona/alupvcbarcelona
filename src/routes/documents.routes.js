const express = require("express");
const DOCUMENT_ROUTES = express.Router();

const {
  CREATE_DOCUMENT,
  GET_DOCUMENTS,
  GET_DOCUMENT,
  UPDATE_DOCUMENT,
  DELETE_DOCUMENT,
  SEND_DOCUMENT,
  CONVERT_TO_INVOICE,
} = require("../controllers/documents/documents.controller");
const { isAuth } = require("../middlewares/is-auth.middleware");

// ALL ROUTES ARE PRIVATE (ADMIN)
DOCUMENT_ROUTES.use(isAuth);

DOCUMENT_ROUTES.get("/", GET_DOCUMENTS); // ?type=presupuesto|factura&status=&q=&year=
DOCUMENT_ROUTES.post("/", CREATE_DOCUMENT);
DOCUMENT_ROUTES.get("/:id", GET_DOCUMENT);
DOCUMENT_ROUTES.put("/:id", UPDATE_DOCUMENT);
DOCUMENT_ROUTES.delete("/:id", DELETE_DOCUMENT);
DOCUMENT_ROUTES.post("/:id/send", SEND_DOCUMENT);
DOCUMENT_ROUTES.post("/:id/invoice", CONVERT_TO_INVOICE);

// ----------------------
// LEGACY ROUTES (OLD FRONTEND /api/quote/*)
// ----------------------
const LEGACY = express.Router();
LEGACY.use(isAuth);
LEGACY.post("/create-quote", CREATE_DOCUMENT);
LEGACY.get("/get-quotes", GET_DOCUMENTS);
LEGACY.get("/get-quote/:id", GET_DOCUMENT);
LEGACY.put("/update-quote/:id", UPDATE_DOCUMENT);
LEGACY.delete("/delete-quote/:id", DELETE_DOCUMENT);

module.exports = { DOCUMENT_ROUTES, LEGACY_QUOTE_ROUTES: LEGACY };
