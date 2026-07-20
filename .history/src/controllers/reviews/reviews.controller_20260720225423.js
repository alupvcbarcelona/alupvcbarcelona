const REVIEW_MODEL = require("../../models/review.model");

const CREATE_REVIEW = async (req, res, next) => {
  try {
    const { username, title, description } = req.body;
    if (!username || !title || !description) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const create_review = new USER_MODEL(req.body);
    await create_review.save();
    if (!create_review) {
      return res.status(500).json({ message: "Failed to create review." });
    }
    return res.status(200).json({
      message: "Create new review.",
      review: create_review,
    });
  } catch (error) {
    console.error("ERROR IN CREATE_REVIEW:", error);
    next(new Error("Error CREATE_REVIEW. Please try again later.".error));
  }
};

const GET_REVIEW = async (req, res, next) => {
  try {
    const reviews = await REVIEW_MODEL.find();
    return res.status(200).json(reviews);
  } catch (error) {
    console.error("ERROR IN GET_REVIEW:", error);
    next(new Error("Error GET_REVIEW. Please try again later.".error));
  }
};

module.exports = {
  CREATE_REVIEW,
  GET_REVIEW,
};
