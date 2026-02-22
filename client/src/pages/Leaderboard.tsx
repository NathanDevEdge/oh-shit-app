import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface LeaderboardUser {
  name: string;
  earned: number;
  time: number;
  isYou: boolean;
}

interface StoredUser {
  email: string;
  salary: number;
  salaryType: "hourly" | "yearly";
}

interface Session {
  earned: number;
  duration: number;
  date: string;
}

export default function Leaderboard() {
  const [, navigate] = useLocation();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/");
      return;
    }
    const me: StoredUser = JSON.parse(storedUser);
    setCurrentEmail(me.email);

    const allUsers: StoredUser[] = JSON.parse(localStorage.getItem("allUsers") || "[]");
    const board: LeaderboardUser[] = allUsers.map((u) => {
      const history: Session[] = JSON.parse(
        localStorage.getItem(`history_${u.email}`) || "[]"
      );
      const earned = history.reduce((acc, s) => acc + s.earned, 0);
      const time = history.reduce((acc, s) => acc + s.duration, 0);
      return {
        name: u.email.split("@")[0],
        earned,
        time,
        isYou: u.email === me.email,
      };
    });
    board.sort((a, b) => b.earned - a.earned);
    setLeaderboard(board);
  }, [navigate]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div>
      <header style={{ marginBottom: "2rem", marginTop: "0.5rem" }}>
        <h1
          className="gold-text"
          style={{ textAlign: "left", fontSize: "2rem", fontWeight: 800, margin: 0 }}
        >
          Leaderboard
        </h1>
        <p style={{ textAlign: "left", marginTop: "4px", color: "oklch(1 0 0 / 0.6)" }}>
          Who earns the most on the throne?
        </p>
      </header>

      {leaderboard.length === 0 ? (
        <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", opacity: 0.7 }}>
          <p>No data yet. Start a session to appear here!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {leaderboard.map((user, i) => (
            <div
              key={i}
              className="glass-panel"
              style={{
                padding: "1rem 1.2rem",
                display: "flex",
                alignItems: "center",
                border: user.isYou
                  ? "1px solid oklch(0.85 0.17 85)"
                  : "1px solid oklch(1 0 0 / 0.1)",
                background: user.isYou ? "oklch(0.85 0.17 85 / 0.08)" : undefined,
                gap: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  width: "36px",
                  textAlign: "center",
                  color: i < 3 ? "oklch(0.85 0.17 85)" : "oklch(1 0 0 / 0.5)",
                }}
              >
                {i < 3 ? medals[i] : `#${i + 1}`}
              </div>
              <div style={{ flex: 1 }}>
                <strong
                  style={{
                    fontSize: "1.05rem",
                    color: user.isYou ? "oklch(0.85 0.17 85)" : "white",
                  }}
                >
                  {user.name} {user.isYou && "(You)"}
                </strong>
                <div style={{ fontSize: "0.8rem", color: "oklch(1 0 0 / 0.6)" }}>
                  {Math.floor(user.time / 60)} mins total
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    color: "oklch(0.78 0.18 155)",
                  }}
                >
                  ${user.earned.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
