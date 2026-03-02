import { useContext, useEffect, useState } from "react";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const Orders = () => {
  const { currency, fetchUserOrders, token, navigate, verifyStripePayment } =
    useContext(ShopContext);
  const location = useLocation();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const loadOrders = async () => {
      const data = await fetchUserOrders();
      setOrders(data);
    };

    if (!token) {
      navigate("/login");
      return;
    }

    const params = new URLSearchParams(location.search);
    const stripeStatus = params.get("stripe");
    const sessionId = params.get("session_id");

    const handleStripeCallbackAndLoad = async () => {
      if (stripeStatus === "success" && sessionId) {
        await verifyStripePayment(sessionId);
        navigate("/orders", { replace: true });
      } else if (stripeStatus === "cancelled") {
        toast.info("Stripe payment was cancelled.");
        navigate("/orders", { replace: true });
      }

      await loadOrders();
    };

    handleStripeCallbackAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate, location.search]);

  return (
    <div className="border-t pt-16">
      <div className="text-2xl">
        <Title text1="MY" text2="ORDERS" />
      </div>

      <div>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-500 mt-6">No orders found.</p>
        ) : (
          orders.map((order) =>
            order.items.map((item, itemIndex) => (
              <div
                key={`${order._id}-${item.productId}-${item.size}-${itemIndex}`}
                className="py-4 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex items-start gap-6 text-sm">
                  <img className="w-16 sm:w-20" src={item.image} alt={item.name} />
                  <div>
                    <p className="sm:text-base font-medium">{item.name}</p>
                    <div className="flex items-center gap-3 mt-2 text-base text-gray-700">
                      <p className="text-lg">
                        {currency}
                        {item.price}
                      </p>
                      <p>Quantity: {item.quantity}</p>
                      <p>Size: {item.size}</p>
                    </div>
                    <p className="mt-2">
                      Date:
                      <span className="text-gray-400">
                        {" "}
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="md:w-1/2 flex justify-between">
                  <div className="flex items-center gap-2">
                    <p className="min-w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-sm md:text-base">{order.status}</p>
                  </div>
                  <button
                    onClick={async () => setOrders(await fetchUserOrders())}
                    className="border px-4 py-2 text-sm font-medium rounded-sm"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default Orders;
