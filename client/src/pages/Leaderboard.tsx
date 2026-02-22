import { useState } from "react";
import { trpc } from "@/lib/trpc";

type Tab = "toilet" | "clog" | "toss";

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>("toilet");

  const { data: toiletBoard, isLoading: toiletLoading } = trpc.sessions.leaderboard.useQuery();
  const { data: clogBoard, isLoading: clogLoading } = trpc.minigames.leaderboard.useQuery({ gameId: "clog" });
  const { data: tossBoard, isLoading: tossLoading } = trpc.minigames.leaderboard.useQuery({ gameId: "toss" });

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "toilet", label: "Toilet Timer", icon: "🚽" },
    { id: "clog", label: "Clog-A-Mole", icon: "🪠" },
    { id: "toss", label: "Paper Toss", icon: "🧻" },
  ];

  const isLoading = tab === "toilet" ? toiletLoading : tab === "clog" ? clogLoading : tossLoading;

  const renderToiletBoard = () => {
    if (!toiletBoard || toiletBoard.length === 0) return <EmptyState />;
    return toiletBoard.map((entry, i) => (
      <div key={entry.userId} style={rowStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={rankStyle(i)}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
          <div>
            <div style={{ color: "#fff", fontWeight: 600 }}>{entry.name || entry.email || "Anonymous"}</div>
            <div style={{ color: "#888", fontSize: "0.75rem" }}>{entry.totalSessions} sessions · {Math.floor(Number(entry.totalSeconds) / 60)}m on throne</div>
          </div>
        </div>
        <div className="gold-text" style={{ fontWeight: 700, fontSize: "1rem" }}>${parseFloat(entry.totalEarnings).toFixed(2)}</div>
      </div>
    ));
  };

  const renderGameBoard = (data: typeof clogBoard) => {
    if (!data || data.length === 0) return <EmptyState />;
    return data.map((entry, i) => (
      <div key={entry.userId} style={rowStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={rankStyle(i)}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
          <div style={{ color: "#fff", fontWeight: 600 }}>{entry.name || entry.email || "Anonymous"}</div>
        </div>
        <div className="gold-text" style={{ fontWeight: 700, fontSize: "1rem" }}>{entry.bestScore} pts</div>
      </div>
    ));
  };

  return (
    <div style={{ padding: "1.5rem 1rem 6rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 className="gold-text" style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.25rem" }}>Leaderboard</h1>
      <p style={{ color: "#888", marginBottom: "1.5rem", fontSize: "0.9rem" }}>Compete with friends across the world.</p>

      {/* Tabs */}
      <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", borderRadius: "0.75rem", padding: "4px", marginBottom: "1.5rem" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "0.5rem", borderRadius: "0.6rem", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem", fontFamily: "Outfit, sans-serif", transition: "all 0.2s", background: tab === t.id ? "linear-gradient(90deg, #f5c518, #e8a000)" : "transparent", color: tab === t.id ? "#1a0a00" : "#888" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: "1.25rem" }}>
        {isLoading ? (
          <p style={{ color: "#888", textAlign: "center" }}>Loading...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {tab === "toilet" && renderToiletBoard()}
            {tab === "clog" && renderGameBoard(clogBoard)}
            {tab === "toss" && renderGameBoard(tossBoard)}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return <p style={{ color: "#888", textAlign: "center", fontSize: "0.9rem", padding: "1rem 0" }}>No scores yet. Be the first! 🏆</p>;
}

const rowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "rgba(255,255,255,0.04)", borderRadius: "8px" };
const rankStyle = (i: number): React.CSSProperties => ({ fontSize: i < 3 ? "1.4rem" : "0.9rem", fontWeight: 700, color: "#f5c518", minWidth: "2rem", textAlign: "center" });
