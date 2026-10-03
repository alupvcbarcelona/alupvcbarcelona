const express = require("express");
const POST_ROUTES = express.Router();

const {
  GET_PUBLIC_POSTS,
  GET_PUBLIC_POST,
  GET_POSTS,
  GET_POST,
  CREATE_POST,
  UPDATE_POST,
  DELETE_POST,
} = require("../controllers/posts/posts.controller");
const { isAuth } = require("../middlewares/is-auth.middleware");

// ADMIN (DECLARED FIRST SO "/admin" IS NOT TAKEN AS A SLUG)
POST_ROUTES.get("/admin/all", isAuth, GET_POSTS);
POST_ROUTES.get("/admin/:id", isAuth, GET_POST);
POST_ROUTES.post("/", isAuth, CREATE_POST);
POST_ROUTES.put("/:id", isAuth, UPDATE_POST);
POST_ROUTES.delete("/:id", isAuth, DELETE_POST);

// PUBLIC
POST_ROUTES.get("/", GET_PUBLIC_POSTS);
POST_ROUTES.get("/:slug", GET_PUBLIC_POST);

module.exports = POST_ROUTES;
