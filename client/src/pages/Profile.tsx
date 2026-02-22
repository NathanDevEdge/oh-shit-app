import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface User {
  email: string;
  salary: number;
  salaryType: "hourly" | "yearly";
}

export default function Profile() {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<User>({ email: "", salary: 0, salaryType: "hourly" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("user", JSON.stringify(user));
    const allUsers: User[] = JSON.parse(localStorage.getItem("allUsers") || "[]");
    const existingIndex = allUsers.findIndex((u) => u.email === user.email);
    if (existingIndex >= 0) {
      allUsers[existingIndex] = user;
    } else {
      allUsers.push(user);
    }
    localStorage.setItem("allUsers", JSON.stringify(allUsers));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
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
    marginBottom: "16px",
  };

  return (
    <div>
      <header style={{ marginBottom: "2rem", marginTop: "0.5rem" }}>
        <h1
          className="gold-text"
          style={{ textAlign: "left", fontSize: "2rem", fontWeight: 800, margin: 0 }}
        >
          Profile
        </h1>
        <p style={{ textAlign: "left", marginTop: "4px", color: "oklch(1 0 0 / 0.6)" }}>
          Manage your income settings
        </p>
      </header>

      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <p style={{ margin: "0 0 20px 0", fontSize: "0.9rem", color: "oklch(1 0 0 / 0.7)" }}>
          Logged in as: <strong style={{ color: "oklch(0.85 0.17 85)" }}>{user.email}</strong>
        </p>
        <form onSubmit={handleSave}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "oklch(1 0 0 / 0.8)" }}>
            Salary Type
          </label>
          <select
            value={user.salaryType}
            onChange={(e) => setUser({ ...user, salaryType: e.target.value as "hourly" | "yearly" })}
            style={{ ...inputStyle, appearance: "none", background: "oklch(0.12 0.02 290)" }}
          >
            <option value="hourly">Hourly ($/hr)</option>
            <option value="yearly">Yearly ($/yr)</option>
          </select>

          <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "oklch(1 0 0 / 0.8)" }}>
            Amount ($)
          </label>
          <input
            type="number"
            value={user.salary}
            onChange={(e) => setUser({ ...user, salary: Number(e.target.value) })}
            min="0"
            step="0.01"
            required
            style={inputStyle}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              marginTop: "0.5rem",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              background: saved
                ? "oklch(0.78 0.18 155)"
                : "linear-gradient(135deg, oklch(0.85 0.17 85), oklch(0.65 0.14 75))",
              color: "oklch(0.1 0.02 290)",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              transition: "background 0.3s",
            }}
          >
            {saved ? "✓ Saved!" : "Save Settings"}
          </button>
        </form>
      </div>

      <button
        onClick={handleLogout}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          border: "none",
          background: "oklch(0.65 0.22 25)",
          color: "white",
          fontFamily: "Outfit, sans-serif",
          fontWeight: 700,
          fontSize: "1rem",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}
