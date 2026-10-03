const express = require("express");
const MEDIA_ROUTES = express.Router();

const { GET_SIGNATURE, GET_MEDIA, DELETE_MEDIA } = require("../controllers/media/media.controller");
const { isAuth } = require("../middlewares/is-auth.middleware");

MEDIA_ROUTES.use(isAuth);
MEDIA_ROUTES.get("/signature", GET_SIGNATURE); // SIGNED DIRECT UPLOAD TO CLOUDINARY
MEDIA_ROUTES.get("/", GET_MEDIA); // LIST IMAGES OF THE FOLDER
MEDIA_ROUTES.delete("/", DELETE_MEDIA); // { publicId }

module.exports = MEDIA_ROUTES;
