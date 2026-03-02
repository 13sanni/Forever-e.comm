import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import loadEnv from "../config/env.js";

const createUserToken = (id) => {
  const env = loadEnv();
  return jwt.sign({ id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
};

const createAdminToken = () => {
  const env = loadEnv();
  return jwt.sign({ isAdmin: true, email: env.adminEmail }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await userModel.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    return res.json({
      success: true,
      token: createUserToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const existingUser = await userModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      token: createUserToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to register user",
    });
  }
};

const adminLogin = async (req, res) => {
  try {
    const env = loadEnv();
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (email !== env.adminEmail || password !== env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    return res.json({
      success: true,
      token: createAdminToken(),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to login admin",
    });
  }
};

const getUserCart = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId).select("cartData cartdata");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const cartData =
      user.cartData && Object.keys(user.cartData).length > 0
        ? user.cartData
        : user.cartdata || {};

    return res.json({
      success: true,
      cartData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch cart",
    });
  }
};

const updateUserCart = async (req, res) => {
  try {
    const { itemId, size, quantity } = req.body;
    if (!itemId || !size || typeof quantity !== "number" || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart update payload",
      });
    }

    const user = await userModel.findById(req.userId).select("cartData cartdata");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingCart =
      user.cartData && Object.keys(user.cartData).length > 0
        ? user.cartData
        : user.cartdata || {};

    const cartData = structuredClone(existingCart);
    if (!cartData[itemId]) {
      cartData[itemId] = {};
    }

    if (quantity === 0) {
      delete cartData[itemId][size];
      if (Object.keys(cartData[itemId]).length === 0) {
        delete cartData[itemId];
      }
    } else {
      cartData[itemId][size] = quantity;
    }

    await userModel.findByIdAndUpdate(req.userId, {
      cartData,
      cartdata: cartData,
    });

    return res.json({
      success: true,
      message: "Cart updated",
      cartData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to update cart",
    });
  }
};

export {
  loginUser,
  registerUser,
  adminLogin,
  getUserCart,
  updateUserCart,
};
