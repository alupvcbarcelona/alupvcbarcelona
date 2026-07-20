const USER_MODEL = require("../../models/user.model");

const CREATE_USER = async (req, res, next) => {
  try {
    const create_user = new USER_MODEL(req.body);
    await create_user.save();
    if (!create_user) {
      return res.status(500).json({ message: "Failed to create user." });
    }
    return res.status(200).json({
      message: "Create new user.",
      user: create_user,
    });
  } catch (error) {
    next(new Error("Error creating user. Please try again later.".error));
  }
};
const LOGIN_USER = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // VALIDATIONS
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }
    const user = await USER_MODEL.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const userSafe = user.toObject();
    delete userSafe.password;

    // CREATE JWT TOKEN
    const bearerToken = CREATE_TOKEN(user._id);
    userSafe.token = bearerToken;

    return res.status(200).json({
      message: "Login successful.",
      user: userSafe,
    });
  } catch (error) {
    next(new Error("Error loging in. Please try again later."));
  }
};

const GET_PROFILE = () => {};

module.exports = {
  CREATE_USER,
  LOGIN_USER,
  GET_PROFILE,
};
