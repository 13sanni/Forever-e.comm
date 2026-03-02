import { v2 as cloudinary } from "cloudinary";
import loadEnv from "./env.js";

const connectCloudinary = async () => {
  const env = loadEnv();
  cloudinary.config({
    cloud_name: env.cloudinaryName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinarySecretKey,
  });
};

export default connectCloudinary;
