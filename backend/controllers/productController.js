import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";

const uploadImageToCloudinary = async (file) => {
  const base64 = file.buffer.toString("base64");
  const dataUri = `data:${file.mimetype};base64,${base64}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    resource_type: "image",
    folder: "ecommerce-products",
  });
  return result.secure_url;
};

const parseSizes = (sizes) => {
  if (Array.isArray(sizes)) return sizes;
  if (typeof sizes === "string") {
    try {
      const parsed = JSON.parse(sizes);
      if (Array.isArray(parsed)) return parsed;
    } catch (error) {
      return [];
    }
  }
  return [];
};

const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller = "false",
    } = req.body;

    if (!name || !description || !price || !category || !subCategory) {
      return res.status(400).json({
        success: false,
        message: "Missing required product fields",
      });
    }

    const parsedSizes = parseSizes(sizes);
    if (parsedSizes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one size",
      });
    }

    const image1 = req.files?.image1?.[0];
    const image2 = req.files?.image2?.[0];
    const image3 = req.files?.image3?.[0];
    const image4 = req.files?.image4?.[0];

    const images = [image1, image2, image3, image4].filter(Boolean);
    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    const imageUrls = await Promise.all(
      images.map((imageFile) => uploadImageToCloudinary(imageFile))
    );

    const product = await productModel.create({
      name,
      description,
      category,
      subCategory,
      price: Number(price),
      bestseller: String(bestseller) === "true",
      sizes: parsedSizes,
      image: imageUrls,
      date: Date.now(),
    });

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to add product",
    });
  }
};

const listProducts = async (req, res) => {
  try {
    const products = await productModel.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

const removeProduct = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product id is required",
      });
    }

    const deletedProduct = await productModel.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({ success: true, message: "Product removed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove product",
    });
  }
};

const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product id is required",
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({ success: true, product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

export { addProduct, listProducts, removeProduct, singleProduct };
