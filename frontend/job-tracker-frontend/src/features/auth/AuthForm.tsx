import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Eye, EyeOff } from "lucide-react";

const AuthForm = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  const { login, signup, error, loading, user } = useAuthStore();

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) return "Invalid email format.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (mode === "signup" && password !== confirmPassword) return "Passwords do not match.";
    if (/('|;|--)/.test(email + password)) return "Invalid characters detected.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateInputs();
    if (validation) {
      setValidationError(validation);
      return;
    }
    setValidationError("");

    if (mode === "login") {
      await login(email, password);
    } else {
      await signup(email, password);
    }
  };

  if (user) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-green-600 font-semibold">Logged in as {user.email}</p>
        <button
          onClick={() => location.reload()}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded cursor-pointer"
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-semibold text-center">
        {mode === "login" ? "Log In" : "Sign Up"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full px-4 py-2 border rounded focus:outline-blue-300"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <input
            className="w-full px-4 py-2 border rounded focus:outline-blue-300 pr-10"
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {mode === "signup" && (
          <input
            className="w-full px-4 py-2 border rounded focus:outline-blue-300"
            placeholder="Confirm Password"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        )}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold transition-all cursor-pointer"
          disabled={loading}
        >
          {loading ? "Loading..." : mode === "login" ? "Log In" : "Sign Up"}
        </button>
      </form>

      {validationError && (
        <p className="text-red-500 text-sm text-center">{validationError}</p>
      )}
      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}

      <div className="text-center text-sm">
        {mode === "login" ? "Don't have an account?" : "Already have an account?"}
        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setValidationError("");
          }}
          className="text-blue-500 ml-1 underline cursor-pointer"
        >
          {mode === "login" ? "Sign up" : "Log in"}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
