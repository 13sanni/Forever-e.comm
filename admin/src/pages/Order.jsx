import { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../config";
import { assets } from "../assets/assets";
import { toast } from "react-toastify";

const statusOptions = [
  "Payment Pending",
  "Order Placed",
  "Packing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const Order = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/order/list`, {
        headers: {
          token,
        },
      });

      if (!response.data.success) {
        toast.error(response.data.message || "Unable to fetch orders");
        return;
      }

      setOrders(response.data.orders || []);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        {
          orderId,
          status: event.target.value,
        },
        {
          headers: {
            token,
          },
        }
      );

      if (!response.data.success) {
        toast.error(response.data.message || "Unable to update status");
        return;
      }

      toast.success("Order status updated");
      fetchAllOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    fetchAllOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h3 className="mb-4">Order Page</h3>

      {loading ? <p>Loading...</p> : null}

      <div>
        {orders.map((order) => (
          <div
            className="grid grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-2 items-start border p-5 md:p-8 my-3 text-xs sm:text-sm text-gray-700"
            key={order._id}
          >
            <img className="w-12" src={assets.parcel_icon} alt="" />
            <div>
              <div>
                {order.items.map((item, index) => (
                  <p className="py-0.5" key={`${order._id}-${index}`}>
                    {item.name} x {item.quantity} <span>{item.size}</span>
                  </p>
                ))}
              </div>
              <p className="mt-3 mb-2 font-medium">
                {order.address.firstName} {order.address.lastName}
              </p>
              <div>
                <p>{order.address.street},</p>
                <p>
                  {order.address.city}, {order.address.state}, {order.address.country},{" "}
                  {order.address.zipcode}
                </p>
              </div>
              <p>{order.address.phone}</p>
            </div>

            <div>
              <p className="text-sm sm:text-[15px]">Items: {order.items.length}</p>
              <p className="mt-3">Method: {order.paymentMethod}</p>
              <p>Payment: {order.payment ? "Done" : "Pending"}</p>
              <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>

            <p className="text-sm sm:text-[15px]">${order.amount}</p>

            <select
              onChange={(event) => statusHandler(event, order._id)}
              value={order.status}
              className="p-2 font-semibold"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Order;
