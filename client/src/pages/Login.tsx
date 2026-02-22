import { useState } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [salary, setSalary] = useState("");
  const [salaryType, setSalaryType] = useState<"hourly" | "yearly">("hourly");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = { email, salary: Number(salary), salaryType };
    localStorage.setItem("user", JSON.stringify(user));

    const allUsers: typeof user[] = JSON.parse(localStorage.getItem("allUsers") || "[]");
    const existingIndex = allUsers.findIndex((u) => u.email === email);
    if (existingIndex >= 0) {
      allUsers[existingIndex] = user;
    } else {
      allUsers.push(user);
    }
    localStorage.setItem("allUsers", JSON.stringify(allUsers));
    navigate("/dashboard");
  };

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
        <h1
          className="gold-text"
          style={{ fontSize: "2.5rem", fontWeight: 800, margin: 0 }}
        >
          Turd Earnings
        </h1>
        <p style={{ color: "oklch(1 0 0 / 0.6)", marginTop: "0.5rem" }}>
          Track how much you earn on the throne.
        </p>
      </div>

      <div className="glass-panel" style={{ width: "100%", maxWidth: "400px", padding: "2rem" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label
              style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "oklch(1 0 0 / 0.8)" }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: "100%",
                background: "oklch(0 0 0 / 0.3)",
                border: "1px solid oklch(1 0 0 / 0.1)",
                borderRadius: "12px",
                padding: "14px",
                color: "white",
                fontFamily: "Outfit, sans-serif",
                fontSize: "1rem",
              }}
            />
          </div>

          <div>
            <label
              style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "oklch(1 0 0 / 0.8)" }}
            >
              Salary Type
            </label>
            <select
              value={salaryType}
              onChange={(e) => setSalaryType(e.target.value as "hourly" | "yearly")}
              style={{
                width: "100%",
                background: "oklch(0.12 0.02 290)",
                border: "1px solid oklch(1 0 0 / 0.1)",
                borderRadius: "12px",
                padding: "14px",
                color: "white",
                fontFamily: "Outfit, sans-serif",
                fontSize: "1rem",
                appearance: "none",
              }}
            >
              <option value="hourly">Hourly ($/hr)</option>
              <option value="yearly">Yearly ($/yr)</option>
            </select>
          </div>

          <div>
            <label
              style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "oklch(1 0 0 / 0.8)" }}
            >
              Amount ($)
            </label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              required
              min="0"
              step="0.01"
              placeholder="e.g. 35"
              style={{
                width: "100%",
                background: "oklch(0 0 0 / 0.3)",
                border: "1px solid oklch(1 0 0 / 0.1)",
                borderRadius: "12px",
                padding: "14px",
                color: "white",
                fontFamily: "Outfit, sans-serif",
                fontSize: "1rem",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: "0.5rem",
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, oklch(0.85 0.17 85), oklch(0.65 0.14 75))",
              color: "oklch(0.1 0.02 290)",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              cursor: "pointer",
              boxShadow: "0 4px 20px oklch(0.85 0.17 85 / 0.35)",
            }}
          >
            Enter the Throne Room 👑
          </button>
        </form>
      </div>
    </div>
  );
}
