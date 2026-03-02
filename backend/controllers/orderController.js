import Stripe from "stripe";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import loadEnv from "../config/env.js";

const allowedStatuses = [
  "Payment Pending",
  "Order Placed",
  "Packing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const getStripeClient = () => {
  const env = loadEnv();
  if (!env.stripeSecretKey) {
    throw new Error("Stripe is not configured. Missing STRIPE_SECRET_KEY.");
  }
  return new Stripe(env.stripeSecretKey);
};

const createStripeLineItems = (items, totalAmount) => {
  const lineItems = items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: `${item.name} (${item.size})`,
      },
      unit_amount: Math.max(1, Math.round(Number(item.price) * 100)),
    },
    quantity: item.quantity,
  }));

  const subTotal = items.reduce(
    (total, item) => total + Number(item.price) * Number(item.quantity),
    0
  );
  const shipping = Math.max(0, Number(totalAmount) - subTotal);

  if (shipping > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Shipping",
        },
        unit_amount: Math.round(shipping * 100),
      },
      quantity: 1,
    });
  }

  return lineItems;
};

const placeOrder = async (req, res) => {
  try {
    const { items, address, amount, paymentMethod = "cod" } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    if (!address || typeof address !== "object") {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount",
      });
    }

    const normalizedPaymentMethod = ["cod", "stripe"].includes(paymentMethod)
      ? paymentMethod
      : "cod";

    if (normalizedPaymentMethod === "stripe") {
      const env = loadEnv();
      console.log("[Order] Stripe payment selected, creating session...");
      console.log("[Order] Stripe key configured:", !!env.stripeSecretKey, "| key prefix:", env.stripeSecretKey?.slice(0, 12));

      const order = await orderModel.create({
        userId: req.userId,
        items,
        address,
        amount,
        paymentMethod: "stripe",
        status: "Payment Pending",
      });

      const stripe = getStripeClient();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: createStripeLineItems(items, amount),
        success_url: `${env.frontendUrl}/orders?stripe=success&session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
        cancel_url: `${env.frontendUrl}/place-order?stripe=cancelled&order_id=${order._id}`,
        metadata: {
          orderId: String(order._id),
          userId: String(req.userId),
        },
      });

      console.log("[Order] Stripe session created:", session.id, "| URL:", session.url?.slice(0, 60));

      await orderModel.findByIdAndUpdate(order._id, {
        stripeSessionId: session.id,
      });

      return res.status(201).json({
        success: true,
        message: "Stripe session created",
        orderId: order._id,
        sessionUrl: session.url,
      });
    }

    const order = await orderModel.create({
      userId: req.userId,
      items,
      address,
      amount,
      paymentMethod: "cod",
      status: "Order Placed",
    });

    await userModel.findByIdAndUpdate(req.userId, {
      cartData: {},
      cartdata: {},
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId: order._id,
    });
  } catch (error) {
    console.error("[Order] placeOrder error:", error.message, error.stack?.split("\n")[1]);
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to place order",
    });
  }
};

const verifyStripePayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Stripe session id is required",
      });
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Invalid Stripe session metadata",
      });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (String(order.userId) !== String(req.userId)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    if (session.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    if (!order.payment) {
      await orderModel.findByIdAndUpdate(orderId, {
        payment: true,
        status: "Order Placed",
      });

      await userModel.findByIdAndUpdate(req.userId, {
        cartData: {},
        cartdata: {},
      });
    }

    return res.json({
      success: true,
      message: "Payment verified",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to verify payment",
    });
  }
};

const userOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ userId: req.userId })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch user orders",
    });
  }
};

const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ createdAt: -1 });
    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: "Order id and status are required",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      message: "Order status updated",
      order: updatedOrder,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to update order status",
    });
  }
};

export {
  placeOrder,
  verifyStripePayment,
  userOrders,
  listOrders,
  updateOrderStatus,
  allowedStatuses,
};
