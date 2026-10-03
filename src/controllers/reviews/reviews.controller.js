const REVIEW_MODEL = require("../../models/review.model");

// LEGACY REVIEWS (CREATED BEFORE MODERATION) HAVE NO "approved" FIELD AND STAY PUBLIC
const PUBLIC_FILTER = { approved: { $ne: false } };

//======================================================
// PUBLIC: CREATE (PENDING APPROVAL)
//======================================================
const CREATE_REVIEW = async (req, res) => {
  const { username, title, description, stars, location, website } = req.body;
  if (website) return res.status(201).json({ message: "Gracias por tu opinión." }); // HONEYPOT

  if (!username?.trim() || !title?.trim() || !description?.trim()) {
    return res.status(400).json({ message: "Nombre, título y opinión son obligatorios." });
  }
  const rating = Number(stars);
  if (!(rating >= 1 && rating <= 5)) {
    return res.status(400).json({ message: "La valoración debe estar entre 1 y 5." });
  }

  const review = await REVIEW_MODEL.create({
    username,
    title,
    description,
    location,
    stars: Math.round(rating),
    approved: false,
  });

  return res.status(201).json({
    message: "Gracias por tu opinión. Se publicará cuando la revisemos.",
    review,
  });
};

//======================================================
// PUBLIC: APPROVED REVIEWS + SUMMARY
//======================================================
const GET_REVIEWS = async (req, res) => {
  const reviews = await REVIEW_MODEL.find(PUBLIC_FILTER).sort({ createdAt: -1 });
  const total = reviews.length;
  const average = total ? reviews.reduce((sum, r) => sum + r.stars, 0) / total : 0;
  return res.status(200).json({
    total,
    average: Math.round(average * 10) / 10,
    data: reviews,
  });
};

//======================================================
// ADMIN: ALL REVIEWS
//======================================================
const GET_ALL_REVIEWS = async (req, res) => {
  const reviews = await REVIEW_MODEL.find().sort({ createdAt: -1 });
  const pending = reviews.filter((r) => r.approved === false).length;
  return res.status(200).json({ total: reviews.length, pending, data: reviews });
};

//======================================================
// ADMIN: APPROVE / HIDE
//======================================================
const UPDATE_REVIEW = async (req, res) => {
  const review = await REVIEW_MODEL.findByIdAndUpdate(
    req.params.id,
    { approved: Boolean(req.body.approved) },
    { new: true },
  );
  if (!review) return res.status(404).json({ message: "Reseña no encontrada." });
  return res.status(200).json({ message: review.approved ? "Reseña publicada." : "Reseña ocultada.", review });
};

//======================================================
// ADMIN: DELETE
//======================================================
const DELETE_REVIEW = async (req, res) => {
  const review = await REVIEW_MODEL.findByIdAndDelete(req.params.id);
  if (!review) return res.status(404).json({ message: "Reseña no encontrada." });
  return res.status(200).json({ message: "Reseña eliminada." });
};

module.exports = {
  CREATE_REVIEW,
  GET_REVIEWS,
  GET_ALL_REVIEWS,
  UPDATE_REVIEW,
  DELETE_REVIEW,
};
