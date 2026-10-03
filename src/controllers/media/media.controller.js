const POST_MODEL = require("../../models/post.model");
const { CLOUDINARY_FOLDER } = require("../../config/env.config");
const { IS_CONFIGURED, UPLOAD_SIGNATURE, DESTROY, LIST } = require("./cloudinary");

const NOT_CONFIGURED = (res) =>
  res.status(503).json({
    success: false,
    message:
      "Cloudinary no está configurado. Añade CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en el servidor.",
  });

// ----------------------
// GET UPLOAD SIGNATURE
// ----------------------
const GET_SIGNATURE = async (req, res) => {
  if (!IS_CONFIGURED()) return NOT_CONFIGURED(res);
  return res.status(200).json({ success: true, data: UPLOAD_SIGNATURE() });
};

// ----------------------
// LIST IMAGES OF THE WEBSITE FOLDER
// ----------------------
const GET_MEDIA = async (req, res) => {
  if (!IS_CONFIGURED()) return NOT_CONFIGURED(res);
  const folder = req.query.all === "true" ? "" : CLOUDINARY_FOLDER;
  const data = await LIST({ folder, cursor: req.query.cursor });

  // MARK IMAGES IN USE BY A POST
  const posts = await POST_MODEL.find({ "images.publicId": { $in: data.images.map((i) => i.publicId) } }).select("title images.publicId");
  const usedBy = new Map();
  posts.forEach((post) => post.images.forEach((img) => usedBy.set(img.publicId, post.title)));
  data.images = data.images.map((img) => ({ ...img, usedBy: usedBy.get(img.publicId) || null }));

  return res.status(200).json({ success: true, data });
};

// ----------------------
// DELETE IMAGE (FROM CLOUDINARY AND FROM ANY POST USING IT)
// ----------------------
const DELETE_MEDIA = async (req, res) => {
  if (!IS_CONFIGURED()) return NOT_CONFIGURED(res);
  const publicId = req.body.publicId || req.query.publicId;
  if (!publicId) return res.status(400).json({ success: false, message: "Falta publicId." });

  const ok = await DESTROY(publicId);
  if (!ok) return res.status(502).json({ success: false, message: "Cloudinary no pudo eliminar la imagen." });

  await POST_MODEL.updateMany({}, { $pull: { images: { publicId } } });
  return res.status(200).json({ success: true, message: "Imagen eliminada." });
};

module.exports = { GET_SIGNATURE, GET_MEDIA, DELETE_MEDIA };
