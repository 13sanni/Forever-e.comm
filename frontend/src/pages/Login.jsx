import { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";

const Login = () => {
  const { backendUrl, setToken, navigate } = useContext(ShopContext);
  const [currentState, setCurrentState] = useState("Login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const endpoint =
        currentState === "Login" ? "/api/user/login" : "/api/user/register";
      const payload =
        currentState === "Login"
          ? { email, password }
          : { name, email, password };

      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || "Authentication failed");
        return;
      }

      setToken(data.token);
      toast.success("Logged in successfully");
      navigate("/");
    } catch {
      toast.error("Unable to connect to server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl ">{currentState}</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {currentState === "Login" ? null : (
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-800"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      )}

      <input
        type="email"
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <div className="w-full flex justify-between text-sm mt-[-8px]">
        <p className="cursor-pointer">Forgot your password?</p>
        {currentState === "Login" ? (
          <p onClick={() => setCurrentState("Sign Up")} className="cursor-pointer">
            Create account.
          </p>
        ) : (
          <p onClick={() => setCurrentState("Login")} className="cursor-pointer">
            Login here.
          </p>
        )}
      </div>

      <button
        disabled={isSubmitting}
        className="bg-black text-white font-light px-8 py-2 mt-4 disabled:opacity-60"
      >
        {isSubmitting
          ? "Please wait..."
          : currentState === "Login"
          ? "Sign In"
          : "Sign Up"}
      </button>
    </form>
  );
};

export default Login;
