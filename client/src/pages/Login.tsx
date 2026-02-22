import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Login() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [salaryType, setSalaryType] = useState<"hourly" | "yearly">("hourly");
  const [salaryAmount, setSalaryAmount] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Welcome back!");
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Account created! Welcome to the throne room.");
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      loginMutation.mutate({ email, password });
    } else {
      registerMutation.mutate({ email, password, name, salaryType, salaryAmount: salaryAmount || "0" });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>💩</div>
        <h1 className="gold-text" style={{ fontSize: "2.5rem", fontWeight: 800, margin: 0 }}>
          Turd Earnings
        </h1>
        <p style={{ color: "oklch(1 0 0 / 0.6)", marginTop: "0.5rem" }}>
          Track how much you earn on the throne.
        </p>
      </div>

      <div className="glass-panel" style={{ width: "100%", maxWidth: "420px", padding: "2rem" }}>
        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "0.75rem",
            padding: "4px",
            marginBottom: "1.5rem",
          }}
        >
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "0.6rem",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.9rem",
                fontFamily: "Outfit, sans-serif",
                transition: "all 0.2s",
                background: mode === m ? "linear-gradient(90deg, #f5c518, #e8a000)" : "transparent",
                color: mode === m ? "#1a0a00" : "#888",
              }}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {mode === "register" && (
            <div>
              <label style={labelStyle}>Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Min. 6 characters" : "••••••••"}
              required
              minLength={mode === "register" ? 6 : undefined}
              style={inputStyle}
            />
          </div>

          {mode === "register" && (
            <>
              <div>
                <label style={labelStyle}>Salary Type</label>
                <select
                  value={salaryType}
                  onChange={(e) => setSalaryType(e.target.value as "hourly" | "yearly")}
                  style={{ ...inputStyle, appearance: "none" as any, background: "oklch(0.12 0.02 290)" }}
                >
                  <option value="hourly">Hourly ($/hr)</option>
                  <option value="yearly">Yearly ($/yr)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Amount ($)</label>
                <input
                  type="number"
                  value={salaryAmount}
                  onChange={(e) => setSalaryAmount(e.target.value)}
                  placeholder={salaryType === "hourly" ? "e.g. 35" : "e.g. 75000"}
                  min="0"
                  step="0.01"
                  style={inputStyle}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: "0.5rem",
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              background: isLoading
                ? "rgba(245,197,24,0.4)"
                : "linear-gradient(135deg, oklch(0.85 0.17 85), oklch(0.65 0.14 75))",
              color: "oklch(0.1 0.02 290)",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              cursor: isLoading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 20px oklch(0.85 0.17 85 / 0.35)",
            }}
          >
            {isLoading
              ? "Please wait..."
              : mode === "login"
              ? "Enter the Throne Room 👑"
              : "Create Account 🚽"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "#666", marginTop: "1.25rem", fontSize: "0.85rem" }}>
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            style={{
              background: "none",
              border: "none",
              color: "#f5c518",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
              fontFamily: "Outfit, sans-serif",
            }}
          >
            {mode === "login" ? "Register here" : "Sign in instead"}
          </button>
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontSize: "0.9rem",
  color: "oklch(1 0 0 / 0.8)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "oklch(0 0 0 / 0.3)",
  border: "1px solid oklch(1 0 0 / 0.1)",
  borderRadius: "12px",
  padding: "14px",
  color: "white",
  fontFamily: "Outfit, sans-serif",
  fontSize: "1rem",
  boxSizing: "border-box",
};
