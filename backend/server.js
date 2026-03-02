import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import loadEnv from "./config/env.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoutes.js";
import orderRouter from "./routes/orderRoute.js";

const app = express();
const env = loadEnv();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.allowedOrigins.length === 0) {
        callback(null, true);
        return;
      }

      if (env.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.get("/healthz", (req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/order", orderRouter);



app.get("/", (req, res) => {
  res.send("API working");
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

const startServer = async () => {
  await connectDB();
  await connectCloudinary();

  app.listen(env.port, () => {
    console.log(`Server started on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
