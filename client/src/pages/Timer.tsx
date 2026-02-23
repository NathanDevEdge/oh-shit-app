import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const TIMER_KEY = "toilet_timer_start";
const TIMER_ACTIVE_KEY = "toilet_timer_active";

export default function Timer() {
  const [, navigate] = useLocation();
  const { data: profile } = trpc.profile.get.useQuery();
  const utils = trpc.useUtils();
  const saveMutation = trpc.sessions.save.useMutation({
    onSuccess: () => {
      utils.sessions.myHistory.invalidate();
      utils.sessions.leaderboard.invalidate();
    },
  });

  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // On mount, restore timer state from localStorage
  useEffect(() => {
    const active = localStorage.getItem(TIMER_ACTIVE_KEY) === "true";
    const startTs = parseInt(localStorage.getItem(TIMER_KEY) || "0", 10);
    if (active && startTs > 0) {
      const now = Date.now();
      setElapsed(Math.floor((now - startTs) / 1000));
      setIsRunning(true);
    }
  }, []);

  // Tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const startTs = parseInt(localStorage.getItem(TIMER_KEY) || "0", 10);
        if (startTs > 0) {
          setElapsed(Math.floor((Date.now() - startTs) / 1000));
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const salaryPerSecond = profile
    ? profile.salaryType === "hourly"
      ? parseFloat(profile.salaryAmount ?? "0") / 3600
      : parseFloat(profile.salaryAmount ?? "0") / (365 * 24 * 3600)
    : 0;

  const earned = elapsed * salaryPerSecond;

  const handleStart = () => {
    const now = Date.now();
    localStorage.setItem(TIMER_KEY, String(now));
    localStorage.setItem(TIMER_ACTIVE_KEY, "true");
    setElapsed(0);
    setIsRunning(true);
    toast.success("Timer started! Enjoy your throne time. 👑");
  };

  const handleStop = useCallback(async () => {
    if (!isRunning || elapsed === 0) return;
    setIsRunning(false);
    localStorage.removeItem(TIMER_KEY);
    localStorage.removeItem(TIMER_ACTIVE_KEY);

    const finalElapsed = elapsed;
    const finalEarned = finalElapsed * salaryPerSecond;

    saveMutation.mutate(
      { durationSeconds: finalElapsed, earningsAmount: finalEarned.toFixed(4) },
      {
        onSuccess: () => {
          toast.success(`Session saved! You earned $${finalEarned.toFixed(4)} 💰`);
          setElapsed(0);
        },
        onError: () => toast.error("Failed to save session."),
      }
    );
  }, [isRunning, elapsed, salaryPerSecond, saveMutation]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div style={{ padding: "1.5rem 1rem 6rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 className="gold-text" style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>Timer</h1>
      <p style={{ color: "#888", marginBottom: "2rem", fontSize: "0.9rem" }}>
        {isRunning ? "You're on the throne. Timer keeps going even if you play a game!" : "Start the timer when you sit down."}
      </p>

      {/* Timer display */}
      <div className="glass-panel" style={{ padding: "2.5rem 1rem", textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "4rem", fontWeight: 900, color: "#fff", fontVariantNumeric: "tabular-nums", letterSpacing: "-2px" }}>
          {formatTime(elapsed)}
        </div>
        <div className="gold-text" style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.75rem" }}>
          ${earned.toFixed(4)}
        </div>
        <div style={{ color: "#888", fontSize: "0.85rem", marginTop: "0.25rem" }}>earned this session</div>
      </div>

      {/* Salary info */}
      {profile && (
        <div className="glass-panel" style={{ padding: "0.75rem 1rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
          <span style={{ color: "#888" }}>Rate: <span style={{ color: "#fff" }}>${parseFloat(profile.salaryAmount ?? "0").toLocaleString()}/{profile.salaryType === "hourly" ? "hr" : "yr"}</span></span>
          <span style={{ color: "#888" }}>Per sec: <span style={{ color: "#f5c518" }}>${salaryPerSecond.toFixed(6)}</span></span>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {!isRunning ? (
          <button onClick={handleStart} style={{ ...btnStyle, background: "linear-gradient(135deg, oklch(0.85 0.17 85), oklch(0.65 0.14 75))", color: "oklch(0.1 0.02 290)" }}>
            🚽 Sit Down & Start
          </button>
        ) : (
          <button onClick={handleStop} disabled={saveMutation.isPending} style={{ ...btnStyle, background: "linear-gradient(135deg, #e74c3c, #c0392b)", color: "#fff" }}>
            {saveMutation.isPending ? "Saving..." : "🏁 Done — Save Session"}
          </button>
        )}

        {isRunning && (
          <button
            onClick={() => navigate("/minigames")}
            style={{ ...btnStyle, background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}
          >
            🎮 Play a Minigame
          </button>
        )}
      </div>

      {isRunning && (
        <p style={{ color: "#666", fontSize: "0.8rem", textAlign: "center", marginTop: "1.5rem" }}>
          ⚠️ Timer is still running while you play. Come back here to stop it.
        </p>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = { padding: "0.875rem", borderRadius: "12px", border: "none", fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "1rem", cursor: "pointer" };
