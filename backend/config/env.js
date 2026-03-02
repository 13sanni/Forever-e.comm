import dotenv from "dotenv";

const requiredEnv = [
  "MONGODB_URI",
  "CLOUDINARY_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_SECRET_KEY",
  "JWT_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
];

const loadEnv = () => {
  // Use override:true so dotenv always forces values from .env into process.env,
  // even if they were previously set (e.g., from a prior dotenv.config() call).
  dotenv.config({ override: true });

  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  if (missingEnv.length) {
    throw new Error(
      `Missing required environment variables: ${missingEnv.join(", ")}`
    );
  }

  return {
    port: Number(process.env.PORT) || 4000,
    mongodbUri: process.env.MONGODB_URI,
    cloudinaryName: process.env.CLOUDINARY_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinarySecretKey: process.env.CLOUDINARY_SECRET_KEY,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    adminEmail: process.env.ADMIN_EMAIL,
    adminPassword: process.env.ADMIN_PASSWORD,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    allowedOrigins: (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
};

export default loadEnv;
