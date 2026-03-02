import mongoose from "mongoose";
import loadEnv from "./env.js";

const connectDB = async () => {
  const env = loadEnv();
  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
  });

  await mongoose.connect(env.mongodbUri, {
    dbName: process.env.MONGODB_DB_NAME || "ecomm",
    serverSelectionTimeoutMS: 10000,
  });
};

export default connectDB;
