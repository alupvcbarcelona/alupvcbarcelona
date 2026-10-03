const express = require("express");
const USER_ROUTES = express.Router();

const {
  CREATE_USER,
  LOGIN_USER,
  GET_PROFILE,
  PUT_PROFILE,
  PUT_PASSWORD,
} = require("../controllers/users/users.controller");
const { isAuth, optionalAuth } = require("../middlewares/is-auth.middleware");
const { RATE_LIMIT } = require("../middlewares/rate-limit.middleware");

/**
 * @route   POST /api/user/create-user
 * @desc    CREATE A NEW ADMIN USER (ADMIN ONLY, OR FIRST USER WITH ALLOW_BOOTSTRAP_ADMIN)
 */
USER_ROUTES.post("/create-user", optionalAuth, CREATE_USER);

/**
 * @route   POST /api/user/login
 * @desc    LOGIN (MAX 10 ATTEMPTS EVERY 15 MINUTES PER IP)
 */
USER_ROUTES.post(
  "/login",
  RATE_LIMIT({ windowMs: 15 * 60_000, max: 10, message: "Demasiados intentos. Espera unos minutos." }),
  LOGIN_USER,
);

/**
 * @route   GET /api/user/profile   PUT /api/user/profile
 * @desc    AUTHENTICATED USER PROFILE
 */
USER_ROUTES.get("/profile", isAuth, GET_PROFILE);
USER_ROUTES.put("/profile", isAuth, PUT_PROFILE);

/**
 * @route   PUT /api/user/update-password
 * @desc    CHANGE PASSWORD (REQUIRES CURRENT PASSWORD)
 */
USER_ROUTES.put("/update-password", isAuth, PUT_PASSWORD);

module.exports = USER_ROUTES;
