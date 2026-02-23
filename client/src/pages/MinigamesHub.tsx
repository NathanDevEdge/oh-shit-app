import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { Trophy, ArrowLeft } from "lucide-react";

const TIMER_ACTIVE_KEY = "toilet_timer_active";
const TIMER_KEY = "toilet_timer_start";

const games = [
  {
    id: "clog" as const,
    title: "Clog-A-Mole",
    emoji: "🪠",
    description: "Whack the poops before the toilet overflows. Build streaks for multipliers!",
    path: "/minigame/clog",
    color: "#8b5cf6",
    colorLight: "rgba(139,92,246,0.15)",
    colorBorder: "rgba(139,92,246,0.3)",
    tip: "4 in a row = 2x · 7 = 3x · 10 = 4x",
  },
  {
    id: "toss" as const,
    title: "Paper Toss",
    emoji: "🧻",
    description: "Drag and throw the paper ball into the toilet. Watch out for the wind!",
    path: "/minigame/toss",
    color: "#f5c518",
    colorLight: "rgba(245,197,24,0.12)",
    colorBorder: "rgba(245,197,24,0.3)",
    tip: "Drag further = more power",
  },
  {
    id: "pipe_panic" as const,
    title: "Pipe Panic",
    emoji: "💩",
    description: "Tap to flap your turd through the sewer pipes. How far can you go?",
    path: "/minigame/pipe-panic",
    color: "#22c55e",
    colorLight: "rgba(34,197,94,0.12)",
    colorBorder: "rgba(34,197,94,0.3)",
    tip: "Speed increases with score",
  },
];

export default function MinigamesHub() {
  const [, navigate] = useLocation();
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(0);

  const { data: personalBests, isLoading } = trpc.minigames.personalBests.useQuery();

  useEffect(() => {
    const active = localStorage.getItem(TIMER_ACTIVE_KEY) === "true";
    setTimerRunning(active);
    if (active) {
      const startTs = parseInt(localStorage.getItem(TIMER_KEY) || "0", 10);
      const tick = () => setTimerElapsed(Math.floor((Date.now() - startTs) / 1000));
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }
  }, []);

  const formatTime = (s: number) =>
    String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

  return (
    <div style={{ padding: "1rem 1rem 6rem", maxWidth: "600px", margin: "0 auto" }}>
      {/* Back button */}
      <button
        onClick={() => navigate("/timer")}
        style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          marginBottom: "1.5rem", padding: "10px 18px", borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
          color: "white", fontFamily: "Outfit, sans-serif", fontWeight: 600, cursor: "pointer",
        }}
      >
        <ArrowLeft size={18} /> Back to Timer
      </button>

      {/* Toilet timer banner */}
      {timerRunning && (
        <div style={{
          background: "rgba(245,197,24,0.12)", border: "1px solid rgba(245,197,24,0.3)",
          borderRadius: "10px", padding: "0.6rem 1rem", marginBottom: "1.5rem",
          display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem",
        }}>
          <span style={{ color: "#f5c518" }}>🚽 Toilet timer running</span>
          <span style={{ color: "#f5c518", fontWeight: 700 }}>{formatTime(timerElapsed)}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>🎮</div>
        <h1 className="gold-text" style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 0.5rem 0" }}>
          Minigames
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", margin: 0 }}>
          Pass the time on the throne. Beat your best scores.
        </p>
      </div>

      {/* Game cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {games.map((game) => {
          const pb = personalBests?.[game.id] ?? 0;
          return (
            <button
              key={game.id}
              onClick={() => navigate(game.path)}
              style={{
                display: "flex", alignItems: "center", gap: "1.25rem",
                background: game.colorLight,
                border: `1px solid ${game.colorBorder}`,
                borderRadius: "20px", padding: "1.25rem 1.5rem",
                cursor: "pointer", textAlign: "left", width: "100%",
                transition: "transform 0.15s, box-shadow 0.15s",
                fontFamily: "Outfit, sans-serif",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 24px ${game.colorBorder}`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              {/* Emoji icon */}
              <div style={{
                fontSize: "3rem", lineHeight: 1,
                background: "rgba(0,0,0,0.25)", borderRadius: "14px",
                padding: "0.5rem 0.75rem", flexShrink: 0,
              }}>
                {game.emoji}
              </div>

              {/* Text content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "white", marginBottom: "0.25rem" }}>
                  {game.title}
                </div>
                <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", lineHeight: 1.4 }}>
                  {game.description}
                </div>
                <div style={{ fontSize: "0.75rem", color: game.color, opacity: 0.8 }}>
                  💡 {game.tip}
                </div>
              </div>

              {/* Personal best */}
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                {isLoading ? (
                  <div style={{ width: "56px", height: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "10px" }} />
                ) : pb > 0 ? (
                  <div style={{
                    background: "rgba(0,0,0,0.3)", borderRadius: "12px",
                    padding: "0.4rem 0.75rem", minWidth: "56px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center", marginBottom: "2px" }}>
                      <Trophy size={12} color={game.color} />
                      <span style={{ fontSize: "0.65rem", color: game.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Best</span>
                    </div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "white", lineHeight: 1 }}>{pb}</div>
                  </div>
                ) : (
                  <div style={{
                    background: "rgba(0,0,0,0.2)", borderRadius: "12px",
                    padding: "0.4rem 0.75rem", minWidth: "56px",
                    fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontWeight: 600,
                  }}>
                    No score<br />yet
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Leaderboard link */}
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button
          onClick={() => navigate("/leaderboard")}
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "12px 24px", borderRadius: "14px",
            border: "2px solid rgba(245,197,24,0.3)", background: "rgba(245,197,24,0.07)",
            color: "#f5c518", fontFamily: "Outfit, sans-serif", fontWeight: 700,
            fontSize: "0.9rem", cursor: "pointer",
          }}
        >
          <Trophy size={18} /> View All Leaderboards
        </button>
      </div>

      <style>{`
        .gold-text { background: linear-gradient(135deg, #ffd700, #b8860b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      `}</style>
    </div>
  );
}
