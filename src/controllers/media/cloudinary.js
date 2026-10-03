const crypto = require("crypto");
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_FOLDER,
} = require("../../config/env.config");

const IS_CONFIGURED = () =>
  Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);

// ----------------------
// SIGN PARAMS (https://cloudinary.com/documentation/authentication_signatures)
// ----------------------
const SIGN = (params) => {
  const toSign = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + CLOUDINARY_API_SECRET).digest("hex");
};

// ----------------------
// SIGNATURE FOR A DIRECT UPLOAD FROM THE BROWSER
// ----------------------
const UPLOAD_SIGNATURE = (folder = CLOUDINARY_FOLDER) => {
  const timestamp = Math.round(Date.now() / 1000);
  const params = { folder, timestamp };
  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    folder,
    timestamp,
    signature: SIGN(params),
    uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
  };
};

// ----------------------
// DELETE AN IMAGE
// ----------------------
const DESTROY = async (publicId) => {
  const timestamp = Math.round(Date.now() / 1000);
  const params = { public_id: publicId, timestamp };
  const body = new URLSearchParams({
    ...params,
    api_key: CLOUDINARY_API_KEY,
    signature: SIGN(params),
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
    { method: "POST", body },
  );
  const data = await response.json();
  return data.result === "ok" || data.result === "not found";
};

// ----------------------
// LIST IMAGES (ADMIN API, BASIC AUTH)
// ----------------------
const LIST = async ({ folder, cursor, max = 50 } = {}) => {
  const params = new URLSearchParams({ max_results: String(max), type: "upload" });
  if (folder) params.set("prefix", `${folder}/`);
  if (cursor) params.set("next_cursor", cursor);

  const auth = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString("base64");
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image?${params}`,
    { headers: { Authorization: `Basic ${auth}` } },
  );
  if (!response.ok) {
    const error = new Error("No se pudieron cargar las imágenes de Cloudinary.");
    error.status = 502;
    throw error;
  }
  const data = await response.json();
  return {
    nextCursor: data.next_cursor || null,
    images: (data.resources || []).map((r) => ({
      publicId: r.public_id,
      url: r.secure_url,
      width: r.width,
      height: r.height,
      bytes: r.bytes,
      format: r.format,
      createdAt: r.created_at,
    })),
  };
};

module.exports = { IS_CONFIGURED, UPLOAD_SIGNATURE, DESTROY, LIST };
