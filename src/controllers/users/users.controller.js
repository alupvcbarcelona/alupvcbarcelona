const bcrypt = require("bcrypt");
const USER_MODEL = require("../../models/user.model");
const { CREATE_TOKEN } = require("../../config/jwt.config");
const { emailWelcome } = require("./email");
const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");

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
    console.error("ERROR IN CREATE_USER:", error);
    next(new Error("Error creating user. Please try again later.".error));
  }
};
const LOGIN_USER = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const rawIp =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.ip ||
      req.socket.remoteAddress;

    const ip = rawIp.replace("::ffff:", "");

    const parser = new UAParser(req.headers["user-agent"]);
    const ua = parser.getResult();

    const device = ua.device.type ?? "Desktop";

    const location = geoip.lookup(ip);

    const loginInfo = {
      ip,
      region: location?.region || "",
      city: location?.city ?? "No disponible",
      country: location?.country ?? "No disponible",
      browser: ua.browser.name || "Unknown",
      browserVersion: ua.browser.version || "",
      os: ua.os.name || "Unknown",
      osVersion: ua.os.version || "",
      device,
      vendor: ua.device.vendor || "",
      model: ua.device.model || "",
      loginAt: new Date(),
    };

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
    await emailWelcome(userSafe, loginInfo); // Send welcome email after successful login

    return res.status(200).json({
      message: "Login successful.",
      user: userSafe,
    });
  } catch (error) {
    console.error("ERROR IN LOGIN_USER:", error);
    next(new Error("Error logging in. Please try again later."));
  }
};

const GET_PROFILE = async (req, res, next) => {
  try {
    const { user } = req;
    return res.status(200).json({ user });
  } catch (error) {
    console.error("ERROR IN PROFILE_USER:", error);
    next(new Error("Error retrieving user profile. Please try again later."));
  }
};

module.exports = {
  CREATE_USER,
  LOGIN_USER,
  GET_PROFILE,
};
