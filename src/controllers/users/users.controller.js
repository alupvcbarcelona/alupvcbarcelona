const bcrypt = require("bcrypt");
const USER_MODEL = require("../../models/user.model");
const { CREATE_TOKEN } = require("../../config/jwt.config");
const { ALLOW_BOOTSTRAP_ADMIN } = require("../../config/env.config");
const { emailWelcome, emailNewPassword } = require("../../emails/users.emails");
const { GET_REQUEST_INFO } = require("../../utils/request-info");

const SAFE_USER = (user) => {
  const safe = user.toObject ? user.toObject() : { ...user };
  delete safe.password;
  return safe;
};

// ----------------------
// CREATE USER
// ONLY AN AUTHENTICATED ADMIN, OR THE VERY FIRST USER WHEN ALLOW_BOOTSTRAP_ADMIN=true
// ----------------------
const CREATE_USER = async (req, res) => {
  const total = await USER_MODEL.estimatedDocumentCount();
  const isBootstrap = total === 0 && ALLOW_BOOTSTRAP_ADMIN;

  if (!req.user && !isBootstrap) {
    return res.status(403).json({ message: "El registro de usuarios está deshabilitado." });
  }

  const { name, lastname, email, password } = req.body;
  if (!name || !lastname || !email || !password || password.length < 8) {
    return res.status(400).json({
      message: "Nombre, apellidos, email y contraseña (mínimo 8 caracteres) son obligatorios.",
    });
  }

  const user = await USER_MODEL.create({
    name,
    lastname,
    email,
    password,
    roles: ["admin"],
  });

  return res.status(201).json({ message: "Usuario creado.", user: SAFE_USER(user) });
};

// ----------------------
// LOGIN
// ----------------------
const LOGIN_USER = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email y contraseña son obligatorios." });
  }

  const user = await USER_MODEL.findOne({ email: String(email).toLowerCase().trim() });
  const isMatch = user ? await bcrypt.compare(password, user.password) : false;
  if (!isMatch) {
    return res.status(401).json({ message: "Email o contraseña incorrectos." });
  }

  const info = await GET_REQUEST_INFO(req);
  const loginInfo = { ...info, loginAt: new Date() };

  user.lastLoginAt = loginInfo.loginAt;
  user.lastLoginIp = info.ip;
  await user.save();

  const userSafe = SAFE_USER(user);
  userSafe.token = CREATE_TOKEN(user._id);

  await emailWelcome(userSafe, loginInfo); // LOGIN ALERT

  return res.status(200).json({ message: "Login correcto.", user: userSafe });
};

// ----------------------
// PROFILE
// ----------------------
const GET_PROFILE = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

// ----------------------
// UPDATE PROFILE (NAME / LASTNAME / EMAIL)
// ----------------------
const PUT_PROFILE = async (req, res) => {
  const { name, lastname, email } = req.body;
  const user = await USER_MODEL.findById(req.user._id);
  if (name) user.name = name;
  if (lastname) user.lastname = lastname;
  if (email) user.email = email;
  await user.save();
  return res.status(200).json({ message: "Perfil actualizado.", user: SAFE_USER(user) });
};

// ----------------------
// CHANGE PASSWORD (AUTHENTICATED, REQUIRES CURRENT PASSWORD)
// ----------------------
const PUT_PASSWORD = async (req, res) => {
  const { currentPassword, password } = req.body;
  if (!currentPassword || !password || password.length < 8) {
    return res.status(400).json({
      message: "Indica la contraseña actual y una nueva de al menos 8 caracteres.",
    });
  }

  const user = await USER_MODEL.findById(req.user._id);
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "La contraseña actual no es correcta." });
  }

  user.password = password;
  await user.save();
  await emailNewPassword(user);

  return res.status(200).json({ message: "Contraseña actualizada correctamente." });
};

module.exports = {
  CREATE_USER,
  LOGIN_USER,
  GET_PROFILE,
  PUT_PROFILE,
  PUT_PASSWORD,
};
