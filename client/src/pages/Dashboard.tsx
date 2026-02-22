import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface Session {
  earned: number;
  duration: number;
  date: string;
}

interface User {
  email: string;
  salary: number;
  salaryType: "hourly" | "yearly";
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [sessionHistory, setSessionHistory] = useState<Session[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/");
      return;
    }
    const parsedUser: User = JSON.parse(storedUser);
    setUser(parsedUser);
    const history: Session[] = JSON.parse(
      localStorage.getItem(`history_${parsedUser.email}`) || "[]"
    );
    setSessionHistory(history);
  }, [navigate]);

  if (!user) return <div style={{ padding: "2rem" }}>Loading...</div>;

  const totalEarned = sessionHistory.reduce((acc, curr) => acc + curr.earned, 0);

  return (
    <div>
      <header style={{ marginBottom: "2rem", marginTop: "0.5rem" }}>
        <h1
          className="gold-text"
          style={{ textAlign: "left", fontSize: "2rem", fontWeight: 800, margin: 0 }}
        >
          Dashboard
        </h1>
        <p style={{ textAlign: "left", marginTop: "4px", color: "oklch(1 0 0 / 0.6)" }}>
          Welcome back to the throne.
        </p>
      </header>

      <div
        className="glass-panel"
        style={{ padding: "1.5rem", marginBottom: "1.5rem", textAlign: "center" }}
      >
        <h3 style={{ margin: 0, color: "oklch(1 0 0 / 0.7)", fontWeight: 400 }}>
          Total Earned on Toilet
        </h3>
        <h1
          style={{
            fontSize: "3rem",
            margin: "10px 0",
            color: "oklch(0.85 0.17 85)",
            fontWeight: 800,
          }}
        >
          ${totalEarned.toFixed(2)}
        </h1>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "oklch(0.78 0.18 155)" }}>
          Across {sessionHistory.length} sessions
        </p>
      </div>

      <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem", fontWeight: 700 }}>
        Recent Sessions
      </h2>

      {sessionHistory.length === 0 ? (
        <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", opacity: 0.7 }}>
          <p>You haven&apos;t tracked any sessions yet.</p>
          <button
            onClick={() => navigate("/timer")}
            style={{
              marginTop: "1rem",
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, oklch(0.85 0.17 85), oklch(0.65 0.14 75))",
              color: "oklch(0.1 0.02 290)",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Go Start Timer
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sessionHistory
            .slice()
            .reverse()
            .slice(0, 5)
            .map((session, i) => (
              <div
                key={i}
                className="glass-panel"
                style={{
                  padding: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ fontSize: "1.1rem", color: "oklch(0.85 0.17 85)" }}>
                    ${session.earned.toFixed(2)}
                  </strong>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "oklch(1 0 0 / 0.6)" }}>
                    {new Date(session.date).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ fontSize: "0.9rem", color: "oklch(1 0 0 / 0.8)" }}>
                  {Math.floor(session.duration / 60)}m {session.duration % 60}s
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
