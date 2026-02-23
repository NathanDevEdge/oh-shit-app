import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const GAMES = [
  {
    id: "clog",
    path: "/minigame/clog",
    icon: "🪠",
    name: "Clog-A-Mole",
    desc: "Whack the poops before they clog the toilet! Streak multipliers up to 4x.",
    color: "#7c3aed",
  },
  {
    id: "toss",
    path: "/minigame/toss",
    icon: "🧻",
    name: "Paper Toss",
    desc: "Drag and throw the paper ball into the toilet. Watch out for wind!",
    color: "#0891b2",
  },
  {
    id: "pipe_panic",
    path: "/minigame/pipe-panic",
    icon: "💩",
    name: "Pipe Panic",
    desc: "Flappy Bird in the sewer! Tap to flap through the pipes. Gets faster!",
    color: "#16a34a",
  },
];

export default function MinigamesHub() {
  const [, navigate] = useLocation();
  const { data: personalBests, isLoading } = trpc.minigames.personalBests.useQuery();

  return (
    <div style={{ padding: "1.5rem 1rem 6rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 className="gold-text" style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.25rem" }}>🎮 Minigames</h1>
      <p style={{ color: "#888", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
        Play games while you sit on the throne. Scores go on the leaderboard!
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {GAMES.map((game) => {
          const pb = personalBests?.[game.id as keyof typeof personalBests] ?? 0;
          return (
            <button
              key={game.id}
              onClick={() => navigate(game.path)}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${game.color}44`,
                borderRadius: "1rem",
                padding: "1.25rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
                fontFamily: "Outfit, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${game.color}18`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${game.color}88`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.borderColor = `${game.color}44`; }}
            >
              <div style={{ fontSize: "2.5rem", minWidth: "3rem", textAlign: "center" }}>{game.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.2rem" }}>{game.name}</div>
                <div style={{ color: "#888", fontSize: "0.82rem", lineHeight: 1.4, marginBottom: "0.5rem" }}>{game.desc}</div>
                {!isLoading && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: pb > 0 ? "rgba(245,197,24,0.12)" : "rgba(255,255,255,0.06)", borderRadius: "1rem", padding: "0.2rem 0.7rem" }}>
                    <span style={{ fontSize: "0.75rem" }}>🏆</span>
                    <span style={{ color: pb > 0 ? "#f5c518" : "#666", fontSize: "0.78rem", fontWeight: 600 }}>
                      {pb > 0 ? `Best: ${pb} pts` : "No score yet"}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ color: game.color, fontSize: "1.4rem", opacity: 0.7 }}>▶</div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "1.5rem", background: "rgba(245,197,24,0.06)", border: "1px solid rgba(245,197,24,0.15)", borderRadius: "0.75rem", padding: "1rem 1.25rem" }}>
        <p style={{ color: "#888", fontSize: "0.82rem", margin: 0, lineHeight: 1.5 }}>
          💡 <strong style={{ color: "#f5c518" }}>Tip:</strong> Start the toilet timer before playing — your earnings keep ticking while you game!
        </p>
      </div>
    </div>
  );
}
