import { useContext, useState } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";

const PlaceOrder = () => {
  const [method, setMethod] = useState("stripe");
  const { navigate, placeOrder, getCartCount } = useContext(ShopContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  const onChangeHandler = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (getCartCount() === 0) {
      navigate("/cart");
      return;
    }

    setIsSubmitting(true);
    const result = await placeOrder(formData, method);
    setIsSubmitting(false);

    console.log("[PlaceOrder] placeOrder result:", result);

    if (result.success) {
      if (result.redirectUrl) {
        console.log("[PlaceOrder] Redirecting to Stripe:", result.redirectUrl);
        window.location.href = result.redirectUrl;
        return;
      }
      navigate("/orders");
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t"
    >
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1="Delivery" text2="Information" />
        </div>
        <div className="flex gap-3">
          <input
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={onChangeHandler}
            placeholder="First Name"
            required
          />
          <input
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={onChangeHandler}
            placeholder="Last Name"
            required
          />
        </div>
        <input
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="email"
          name="email"
          value={formData.email}
          onChange={onChangeHandler}
          placeholder="Email"
          required
        />
        <input
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="text"
          name="street"
          value={formData.street}
          onChange={onChangeHandler}
          placeholder="Street"
          required
        />
        <div className="flex gap-3">
          <input
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            name="city"
            value={formData.city}
            onChange={onChangeHandler}
            placeholder="City"
            required
          />
          <input
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            name="state"
            value={formData.state}
            onChange={onChangeHandler}
            placeholder="State"
            required
          />
        </div>
        <div className="flex gap-3">
          <input
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            name="zipcode"
            value={formData.zipcode}
            onChange={onChangeHandler}
            placeholder="Zipcode"
            required
          />
          <input
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            name="country"
            value={formData.country}
            onChange={onChangeHandler}
            placeholder="Country"
            required
          />
        </div>

        <input
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="text"
          name="phone"
          value={formData.phone}
          onChange={onChangeHandler}
          placeholder="Phone Number"
          required
        />
      </div>

      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>
        <div className="mt-12">
          <Title text1="Payment" text2="Method" />

          <div className="flex flex-col gap-3 lg:flex-row">
            <div
              onClick={() => setMethod("stripe")}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "stripe" ? "bg-green-400" : ""
                }`}
              />
              <img className="h-5 mx-4" src={assets.stripe_logo} alt="Stripe" />
            </div>
            <div
              onClick={() => setMethod("cod")}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "cod" ? "bg-green-400" : ""
                }`}
              />
              <p className="text-gray-500 text-sm font-medium mx-4">Cash on delivery</p>
            </div>
          </div>
          <div className="w-full text-end mt-8">
            <button
              disabled={isSubmitting}
              type="submit"
              className="bg-black text-white px-16 py-3 text-sm disabled:opacity-60"
            >
              {isSubmitting ? "PLACING..." : "PLACE ORDER"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
