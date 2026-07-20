const USER_MODEL = require("../../models/user.model");

const CREATE_USER = async (req, res, next) => {
  try {
    const create_user = new USER_MODEL(req.body);
    await create_user.save();
    if (!create_user) {
      return res.status(500).json({ message: "Failed to create user." });
    }
  } catch (error) {
    next(new Error("Error creating user. Please try again later.".error));
  }
};
const LOGIN_USER = () => {};

const GET_PROFILE = () => {};

module.exports = {
  CREATE_USER,
  LOGIN_USER,
  GET_PROFILE,
};
