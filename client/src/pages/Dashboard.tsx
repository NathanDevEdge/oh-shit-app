import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString();
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery();
  const { data: sessions, isLoading: sessionsLoading } = trpc.sessions.myHistory.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({ onSuccess: () => navigate("/") });

  if (profileLoading) {
    return <div style={pageStyle}><p style={{ color: "#888", textAlign: "center", paddingTop: "4rem" }}>Loading...</p></div>;
  }
  if (!profile) { navigate("/"); return null; }

  const totalEarnings = sessions?.reduce((sum, s) => sum + parseFloat(s.earningsAmount), 0) ?? 0;
  const totalSessions = sessions?.length ?? 0;
  const totalSeconds = sessions?.reduce((sum, s) => sum + s.durationSeconds, 0) ?? 0;
  const salaryPerSecond = profile.salaryType === "hourly"
    ? parseFloat(profile.salaryAmount ?? "0") / 3600
    : parseFloat(profile.salaryAmount ?? "0") / (365 * 24 * 3600);

  return (
    <div style={pageStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 className="gold-text" style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>Dashboard</h1>
          <p style={{ color: "#888", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>Welcome back, {profile.name || profile.email}!</p>
        </div>
        <button onClick={() => logoutMutation.mutate()} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "#aaa", padding: "0.4rem 0.9rem", cursor: "pointer", fontSize: "0.85rem", fontFamily: "Outfit, sans-serif" }}>Sign Out</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Earned", value: `$${totalEarnings.toFixed(4)}`, icon: "💰" },
          { label: "Sessions", value: String(totalSessions), icon: "🚽" },
          { label: "Time on Throne", value: formatDuration(totalSeconds), icon: "⏱️" },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel" style={{ padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem" }}>{stat.icon}</div>
            <div className="gold-text" style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.25rem" }}>{stat.value}</div>
            <div style={{ color: "#888", fontSize: "0.7rem", marginTop: "0.2rem" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: "#888", fontSize: "0.8rem", margin: 0 }}>Your Rate</p>
            <p style={{ color: "#fff", fontWeight: 600, margin: "0.25rem 0 0" }}>${parseFloat(profile.salaryAmount ?? "0").toLocaleString()} / {profile.salaryType === "hourly" ? "hr" : "yr"}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "#888", fontSize: "0.8rem", margin: 0 }}>Per Second</p>
            <p style={{ color: "#f5c518", fontWeight: 600, margin: "0.25rem 0 0" }}>${salaryPerSecond.toFixed(6)}/s</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <button onClick={() => navigate("/timer")} style={actionBtnStyle}>🚽 Start Session</button>
        <button onClick={() => navigate("/leaderboard")} style={{ ...actionBtnStyle, background: "rgba(255,255,255,0.06)", color: "#fff" }}>🏆 Leaderboard</button>
      </div>

      <div className="glass-panel" style={{ padding: "1.25rem" }}>
        <h3 style={{ color: "#fff", fontWeight: 700, margin: "0 0 1rem", fontSize: "1rem" }}>Recent Sessions</h3>
        {sessionsLoading ? (
          <p style={{ color: "#888", textAlign: "center" }}>Loading...</p>
        ) : !sessions || sessions.length === 0 ? (
          <p style={{ color: "#888", textAlign: "center", fontSize: "0.9rem" }}>No sessions yet. Hit the throne! 🚽</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {sessions.map((session) => (
              <div key={session.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.75rem", background: "rgba(255,255,255,0.04)", borderRadius: "8px" }}>
                <div>
                  <span style={{ color: "#fff", fontSize: "0.9rem" }}>{formatDuration(session.durationSeconds)}</span>
                  <span style={{ color: "#666", fontSize: "0.75rem", marginLeft: "0.5rem" }}>{formatDate(session.createdAt)}</span>
                </div>
                <span className="gold-text" style={{ fontWeight: 700, fontSize: "0.95rem" }}>${parseFloat(session.earningsAmount).toFixed(4)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = { padding: "1.5rem 1rem 6rem", maxWidth: "600px", margin: "0 auto" };
const actionBtnStyle: React.CSSProperties = { padding: "0.875rem", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, oklch(0.85 0.17 85), oklch(0.65 0.14 75))", color: "oklch(0.1 0.02 290)", fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" };
