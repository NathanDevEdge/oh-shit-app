import { useState, useEffect } from "react";

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

interface AdminUser extends StoredUser {
  totalEarned: number;
  totalTime: number;
  sessions: number;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    const allUsers: StoredUser[] = JSON.parse(localStorage.getItem("allUsers") || "[]");
    const enriched: AdminUser[] = allUsers.map((u) => {
      const history: Session[] = JSON.parse(
        localStorage.getItem(`history_${u.email}`) || "[]"
      );
      return {
        ...u,
        totalEarned: history.reduce((acc, s) => acc + s.earned, 0),
        totalTime: history.reduce((acc, s) => acc + s.duration, 0),
        sessions: history.length,
      };
    });
    setUsers(enriched);
  }, []);

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1
        className="gold-text"
        style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 0.5rem 0" }}
      >
        Admin Dashboard
      </h1>
      <p style={{ color: "oklch(1 0 0 / 0.6)", marginBottom: "2rem" }}>
        All registered users and their stats.
      </p>

      {users.length === 0 ? (
        <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", opacity: 0.7 }}>
          <p>No users registered yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {users.map((u, i) => (
            <div key={i} className="glass-panel" style={{ padding: "1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong style={{ color: "oklch(0.85 0.17 85)", fontSize: "1rem" }}>
                    {u.email}
                  </strong>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "oklch(1 0 0 / 0.6)" }}>
                    {u.salaryType === "hourly" ? `$${u.salary}/hr` : `$${u.salary}/yr`} •{" "}
                    {u.sessions} sessions
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "oklch(0.78 0.18 155)", fontWeight: 700 }}>
                    ${u.totalEarned.toFixed(2)}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "oklch(1 0 0 / 0.5)" }}>
                    {Math.floor(u.totalTime / 60)}m total
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
