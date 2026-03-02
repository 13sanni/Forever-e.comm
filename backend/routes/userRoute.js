import express from "express";
import {
  adminLogin,
  getUserCart,
  loginUser,
  registerUser,
  updateUserCart,
} from "../controllers/userController.js";
import authUser from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/admin", adminLogin);
userRouter.get("/cart", authUser, getUserCart);
userRouter.post("/cart", authUser, updateUserCart);

export default userRouter;
