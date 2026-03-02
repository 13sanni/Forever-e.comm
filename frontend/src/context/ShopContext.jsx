/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { products as localProducts } from "../assets/assets";

export const ShopContext = createContext();

const ShopContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
  const currency = "$";
  const delivery_fee = 10;

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [cartItems, setCartItems] = useState(() => {
    const localCart = localStorage.getItem("cartItems");
    if (!localCart) return {};
    try {
      return JSON.parse(localCart);
    } catch {
      return {};
    }
  });

  const authHeaders = token
    ? {
        "Content-Type": "application/json",
        token,
      }
    : { "Content-Type": "application/json" };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/product/list`);
      const data = await response.json();

      if (data.success) {
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        } else {
          setProducts(localProducts);
        }
      } else {
        setProducts(localProducts);
      }
    } catch {
      setProducts(localProducts);
    }
  };

  const fetchUserCart = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${backendUrl}/api/user/cart`, {
        headers: {
          token,
        },
      });
      const data = await response.json();

      if (data.success) {
        setCartItems(data.cartData || {});
      } else {
        toast.error(data.message || "Unable to load cart");
      }
    } catch {
      toast.error("Unable to load cart");
    }
  };

  const syncCartItem = async (itemId, size, quantity) => {
    if (!token) return true;

    try {
      const response = await fetch(`${backendUrl}/api/user/cart`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          itemId,
          size,
          quantity,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || "Unable to update cart");
        return false;
      }

      return true;
    } catch {
      toast.error("Unable to update cart");
      return false;
    }
  };

  const addToCart = async (itemId, size) => {
    if (!size) {
      toast.error("Select product size");
      return;
    }

    const previousCart = structuredClone(cartItems);
    const nextCart = structuredClone(cartItems);

    if (!nextCart[itemId]) {
      nextCart[itemId] = {};
    }
    nextCart[itemId][size] = (nextCart[itemId][size] || 0) + 1;

    setCartItems(nextCart);
    const synced = await syncCartItem(itemId, size, nextCart[itemId][size]);
    if (!synced) {
      setCartItems(previousCart);
    }
  };

  const updateQuantity = async (itemId, size, quantity) => {
    if (quantity < 0) return;

    const previousCart = structuredClone(cartItems);
    const nextCart = structuredClone(cartItems);

    if (!nextCart[itemId]) {
      nextCart[itemId] = {};
    }

    if (quantity === 0) {
      delete nextCart[itemId][size];
      if (Object.keys(nextCart[itemId]).length === 0) {
        delete nextCart[itemId];
      }
    } else {
      nextCart[itemId][size] = quantity;
    }

    setCartItems(nextCart);
    const synced = await syncCartItem(itemId, size, quantity);
    if (!synced) {
      setCartItems(previousCart);
    }
  };

  const getCartCount = () => {
    let totalCount = 0;
    for (const itemId in cartItems) {
      for (const size in cartItems[itemId]) {
        const qty = cartItems[itemId][size];
        if (qty > 0) {
          totalCount += qty;
        }
      }
    }
    return totalCount;
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const itemId in cartItems) {
      const itemInfo = products.find((product) => product._id === itemId);
      if (!itemInfo) continue;

      for (const size in cartItems[itemId]) {
        const qty = cartItems[itemId][size];
        if (qty > 0) {
          totalAmount += itemInfo.price * qty;
        }
      }
    }
    return totalAmount;
  };

  const buildOrderItems = () => {
    const items = [];

    for (const itemId in cartItems) {
      const product = products.find((p) => p._id === itemId);
      if (!product) continue;

      for (const size in cartItems[itemId]) {
        const quantity = cartItems[itemId][size];
        if (quantity <= 0) continue;

        items.push({
          productId: product._id,
          name: product.name,
          image: product.image[0],
          price: product.price,
          size,
          quantity,
        });
      }
    }

    return items;
  };

  const placeOrder = async (address, paymentMethod) => {
    if (!token) {
      toast.error("Please login to place an order");
      return { success: false };
    }

    const items = buildOrderItems();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return { success: false };
    }

    const amount = getCartAmount() + delivery_fee;

    try {
      const response = await fetch(`${backendUrl}/api/order/place`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          items,
          address,
          amount,
          paymentMethod,
        }),
      });
      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "Unable to place order");
        return { success: false };
      }

      if (data.sessionUrl) {
        return {
          success: true,
          redirectUrl: data.sessionUrl,
        };
      }

      setCartItems({});
      toast.success("Order placed successfully");
      return { success: true };
    } catch {
      toast.error("Unable to place order");
      return { success: false };
    }
  };

  const verifyStripePayment = async (sessionId) => {
    if (!token || !sessionId) {
      return { success: false };
    }

    try {
      const response = await fetch(`${backendUrl}/api/order/verify-stripe`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || "Unable to verify Stripe payment");
        return { success: false };
      }

      setCartItems({});
      toast.success("Payment successful");
      return { success: true };
    } catch {
      toast.error("Unable to verify Stripe payment");
      return { success: false };
    }
  };

  const fetchUserOrders = async () => {
    if (!token) return [];

    try {
      const response = await fetch(`${backendUrl}/api/order/user`, {
        headers: {
          token,
        },
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || "Unable to load orders");
        return [];
      }

      return data.orders || [];
    } catch {
      toast.error("Unable to load orders");
      return [];
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      fetchUserCart();
    } else {
      localStorage.removeItem("token");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    addToCart,
    getCartCount,
    updateQuantity,
    getCartAmount,
    navigate,
    token,
    setToken,
    backendUrl,
    fetchProducts,
    fetchUserOrders,
    placeOrder,
    verifyStripePayment,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider;
