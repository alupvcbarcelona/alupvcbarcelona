const POST_MODEL = require("../../models/post.model");
const { IS_CONFIGURED, DESTROY } = require("../media/cloudinary");

const SLUGIFY = (text) =>
  String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "trabajo";

const UNIQUE_SLUG = async (title, ignoreId) => {
  const base = SLUGIFY(title);
  let slug = base;
  let i = 2;
  while (await POST_MODEL.exists({ slug, _id: { $ne: ignoreId } })) slug = `${base}-${i++}`;
  return slug;
};

const PICK = (body) => {
  const fields = ["title", "category", "location", "excerpt", "content", "images", "published", "featured", "workDate"];
  return Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
};

const NOT_FOUND = (res) => res.status(404).json({ success: false, message: "Trabajo no encontrado." });

//======================================================
// PUBLIC: PUBLISHED POSTS (FILTERS: category, featured, limit)
//======================================================
const GET_PUBLIC_POSTS = async (req, res) => {
  const filter = { published: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.featured === "true") filter.featured = true;
  const limit = Math.min(Number(req.query.limit) || 60, 100);

  const [posts, categories] = await Promise.all([
    POST_MODEL.find(filter).sort({ featured: -1, publishedAt: -1 }).limit(limit).select("-content"),
    POST_MODEL.distinct("category", { published: true }),
  ]);

  return res.status(200).json({ success: true, categories, data: posts });
};

//======================================================
// PUBLIC: ONE POST BY SLUG
//======================================================
const GET_PUBLIC_POST = async (req, res) => {
  const post = await POST_MODEL.findOne({ slug: req.params.slug, published: true });
  if (!post) return NOT_FOUND(res);

  const related = await POST_MODEL.find({ published: true, _id: { $ne: post._id }, category: post.category })
    .sort({ publishedAt: -1 })
    .limit(3)
    .select("-content");

  return res.status(200).json({ success: true, data: post, related });
};

//======================================================
// ADMIN: ALL POSTS
//======================================================
const GET_POSTS = async (req, res) => {
  const posts = await POST_MODEL.find().sort({ createdAt: -1 });
  return res.status(200).json({ success: true, total: posts.length, data: posts });
};

const GET_POST = async (req, res) => {
  const post = await POST_MODEL.findById(req.params.id);
  if (!post) return NOT_FOUND(res);
  return res.status(200).json({ success: true, data: post });
};

//======================================================
// ADMIN: CREATE
//======================================================
const CREATE_POST = async (req, res) => {
  if (!req.body.title?.trim()) {
    return res.status(400).json({ success: false, message: "El título es obligatorio." });
  }
  const data = PICK(req.body);
  data.slug = await UNIQUE_SLUG(req.body.slug || req.body.title);
  if (data.published) data.publishedAt = new Date();

  const post = await POST_MODEL.create(data);
  return res.status(201).json({ success: true, message: "Trabajo creado.", data: post });
};

//======================================================
// ADMIN: UPDATE
//======================================================
const UPDATE_POST = async (req, res) => {
  const post = await POST_MODEL.findById(req.params.id);
  if (!post) return NOT_FOUND(res);

  const data = PICK(req.body);
  if (req.body.slug && req.body.slug !== post.slug) data.slug = await UNIQUE_SLUG(req.body.slug, post._id);
  if (data.published && !post.publishedAt) data.publishedAt = new Date();

  post.set(data);
  await post.save();
  return res.status(200).json({ success: true, message: "Trabajo actualizado.", data: post });
};

//======================================================
// ADMIN: DELETE (?deleteImages=true ALSO REMOVES THE PHOTOS FROM CLOUDINARY)
//======================================================
const DELETE_POST = async (req, res) => {
  const post = await POST_MODEL.findById(req.params.id);
  if (!post) return NOT_FOUND(res);

  let deletedImages = 0;
  if (req.query.deleteImages === "true" && IS_CONFIGURED()) {
    for (const image of post.images) {
      if (!image.publicId) continue;
      const usedElsewhere = await POST_MODEL.exists({ _id: { $ne: post._id }, "images.publicId": image.publicId });
      if (!usedElsewhere && (await DESTROY(image.publicId))) deletedImages += 1;
    }
  }

  await post.deleteOne();
  return res.status(200).json({
    success: true,
    message: deletedImages ? `Trabajo eliminado junto con ${deletedImages} fotos.` : "Trabajo eliminado.",
  });
};

module.exports = {
  GET_PUBLIC_POSTS,
  GET_PUBLIC_POST,
  GET_POSTS,
  GET_POST,
  CREATE_POST,
  UPDATE_POST,
  DELETE_POST,
};
