import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../utils/api";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await login({
        email: form.email ? form.email.trim() : "",
        password: form.password ? form.password.trim() : ""
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-5 font-sans">
      <div className="bg-white rounded-xl p-10 w-full max-w-sm shadow-lg">
        <div className="text-center mb-7">
          <span className="text-[40px]">🎯</span>
          <h1 className="text-2xl font-bold text-navy mt-2 mb-1">
            Smart CV Filter
          </h1>
          <p className="text-[13px] text-gray-400 m-0">
            AI-Powered Recruitment Platform
          </p>
        </div>

        <h2 className="text-lg font-semibold text-gray-800 mb-5 text-center">
          HR Admin Login
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600">Email Address</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="hr@company.com"
              required
              className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-[15px] outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 pr-12 rounded-lg border border-gray-300 text-[15px] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`bg-primary text-white py-3 border-0 rounded-lg text-base font-semibold mt-2 flex items-center justify-center gap-2 transition-opacity ${
              loading ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:opacity-90"
            }`}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Logging in...</span>
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-gray-400">
          🔒 Authorized HR Personnel Only
        </p>
      </div>
    </div>
  );
}
