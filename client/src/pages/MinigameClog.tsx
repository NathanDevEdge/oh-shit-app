import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Trophy, RotateCcw } from "lucide-react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

const TIMER_ACTIVE_KEY = "toilet_timer_active";
const TIMER_KEY = "toilet_timer_start";

export default function MinigameClog() {
  const [, navigate] = useLocation();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [activeMole, setActiveMole] = useState<{ index: number; type: "poop" | "duck" } | null>(null);
  const [flushingMole, setFlushingMole] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(0);

  // Streak multiplier state
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [showMultiplierBurst, setShowMultiplierBurst] = useState(false);

  const gameInterval = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const streakRef = useRef(0);

  const submitMutation = trpc.minigames.submitScore.useMutation({
    onSuccess: () => toast.success("Score saved to leaderboard! 🏆"),
    onError: () => toast.error("Could not save score — are you logged in?"),
  });

  const { data: personalBests } = trpc.minigames.personalBests.useQuery();
  const prevBest = personalBests?.clog ?? 0;
  const isNewPB = gameOver && finalScore > 0 && finalScore > prevBest;

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
    return () => {
      if (gameInterval.current) clearTimeout(gameInterval.current);
      if (moleTimeout.current) clearTimeout(moleTimeout.current);
    };
  }, []);

  const getMultiplier = (s: number) => {
    if (s >= 10) return 4;
    if (s >= 7) return 3;
    if (s >= 4) return 2;
    return 1;
  };

  const popMole = () => {
    if (!isPlayingRef.current) return;

    const minDelay = Math.max(300, 1000 - Math.floor(scoreRef.current / 50) * 100);
    const maxDelay = Math.max(800, 1800 - Math.floor(scoreRef.current / 50) * 150);
    const timeToWait = Math.random() * (maxDelay - minDelay) + minDelay;

    gameInterval.current = setTimeout(() => {
      if (!isPlayingRef.current) return;

      const index = Math.floor(Math.random() * 9);
      const isDuck = Math.random() > 0.8;
      setActiveMole({ index, type: isDuck ? "duck" : "poop" });

      const visibleTime = Math.max(600, 1500 - Math.floor(scoreRef.current / 50) * 100);

      moleTimeout.current = setTimeout(() => {
        if (!isDuck && isPlayingRef.current) {
          // Missed a poop — break the streak
          streakRef.current = 0;
          setStreak(0);
          setMultiplier(1);
          loseLife();
        }
        setActiveMole(null);
        popMole();
      }, visibleTime);
    }, timeToWait);
  };

  const loseLife = () => {
    livesRef.current -= 1;
    setLives(livesRef.current);
    if (livesRef.current <= 0) {
      endGame();
    } else {
      toast.error("Life lost! 🧻", { duration: 1000 });
    }
  };

  const endGame = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setGameOver(true);
    setActiveMole(null);
    if (gameInterval.current) clearTimeout(gameInterval.current);
    if (moleTimeout.current) clearTimeout(moleTimeout.current);
    setFinalScore(scoreRef.current);
    submitMutation.mutate({ gameId: "clog", score: scoreRef.current });
  };

  const startGame = () => {
    scoreRef.current = 0;
    livesRef.current = 3;
    streakRef.current = 0;
    setScore(0);
    setLives(3);
    setStreak(0);
    setMultiplier(1);
    setGameOver(false);
    setFinalScore(0);
    isPlayingRef.current = true;
    setIsPlaying(true);
    popMole();
  };

  const whack = (index: number) => {
    if (!isPlayingRef.current || !activeMole || activeMole.index !== index) return;

    if (activeMole.type === "poop") {
      // Increment streak and calculate multiplier
      streakRef.current += 1;
      const newStreak = streakRef.current;
      const mult = getMultiplier(newStreak);
      const points = 10 * mult;

      scoreRef.current += points;
      setScore(scoreRef.current);
      setStreak(newStreak);

      const prevMult = getMultiplier(newStreak - 1);
      if (mult > prevMult) {
        // Multiplier just levelled up — show burst
        setMultiplier(mult);
        setShowMultiplierBurst(true);
        setTimeout(() => setShowMultiplierBurst(false), 800);
        toast.success(`${mult}x MULTIPLIER! 🔥`, { duration: 1200 });
      } else {
        setMultiplier(mult);
      }

      setFlushingMole(index);
      setTimeout(() => setFlushingMole(null), 500);

      if (moleTimeout.current) clearTimeout(moleTimeout.current);
      setActiveMole(null);
      popMole();
    } else {
      // Hit a duck — break streak
      streakRef.current = 0;
      setStreak(0);
      setMultiplier(1);
      loseLife();
      if (moleTimeout.current) clearTimeout(moleTimeout.current);
      setActiveMole(null);
      popMole();
    }
  };

  const formatTime = (s: number) =>
    String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

  // ── Game Over Screen ──────────────────────────────────────────────────────
  if (gameOver) {
    return (
      <div style={{ padding: "1rem 1rem 6rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        {timerRunning && (
          <div style={{ background: "rgba(245,197,24,0.12)", border: "1px solid rgba(245,197,24,0.3)", borderRadius: "10px", padding: "0.6rem 1rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
            <span style={{ color: "#f5c518" }}>🚽 Toilet timer running</span>
            <span style={{ color: "#f5c518", fontWeight: 700 }}>{formatTime(timerElapsed)}</span>
          </div>
        )}

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "5rem", marginBottom: "0.5rem" }}>💩</div>
          <h1 className="gold-text" style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 0.5rem 0" }}>Game Over!</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem" }}>The toilet is clogged beyond saving.</p>
        </div>

        <div className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem", borderRadius: "20px" }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.5, marginBottom: "0.5rem" }}>Final Score</div>
          <div style={{ fontSize: "4rem", fontWeight: 800, color: "#f5c518", lineHeight: 1 }}>{finalScore}</div>
          {isNewPB && (
            <div style={{ marginTop: "0.75rem", display: "inline-flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, #ffd700, #b8860b)", color: "#0b0710", borderRadius: "20px", padding: "4px 14px", fontSize: "0.85rem", fontWeight: 800 }}>
              🏆 New Personal Best!
            </div>
          )}
          {!isNewPB && prevBest > 0 && (
            <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.35)" }}>Your best: {prevBest}</div>
          )}
          {finalScore > 0 && (
            <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
              {finalScore >= 500 ? "🏆 Legendary Plunger!" : finalScore >= 200 ? "⭐ Great Plunging!" : "Keep practising!"}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "320px", margin: "0 auto" }}>
          <button
            onClick={startGame}
            className="gold-button"
            style={{ padding: "16px 32px", fontSize: "1.1rem", borderRadius: "14px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <RotateCcw size={20} /> Play Again
          </button>

          <button
            onClick={() => navigate("/leaderboard")}
            style={{ padding: "16px 32px", fontSize: "1rem", borderRadius: "14px", fontWeight: 700, border: "2px solid rgba(245,197,24,0.4)", background: "rgba(245,197,24,0.08)", color: "#f5c518", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "background 0.2s" }}
          >
            <Trophy size={20} /> View Leaderboard
          </button>

          <button
            onClick={() => navigate("/timer")}
            style={{ padding: "16px 32px", fontSize: "1rem", borderRadius: "14px", fontWeight: 700, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "background 0.2s" }}
          >
            <ArrowLeft size={20} /> Back to Timer
          </button>
        </div>

        <style>{`
          .gold-button { background: linear-gradient(135deg, #ffd700, #b8860b); color: #0b0710; border: none; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
          .gold-button:active { transform: scale(0.95); }
        `}</style>
      </div>
    );
  }

  // ── Main Game Screen ──────────────────────────────────────────────────────
  return (
    <div style={{ padding: "1rem 1rem 6rem", maxWidth: "600px", margin: "0 auto" }}>
      <button onClick={() => navigate("/timer")} style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "1rem", padding: "10px 18px", borderRadius: "12px", border: "1px solid oklch(1 0 0 / 0.1)", background: "oklch(1 0 0 / 0.05)", color: "white", fontFamily: "Outfit, sans-serif", fontWeight: 600, cursor: "pointer" }}>
        <ArrowLeft size={18} /> Back to Timer
      </button>

      {timerRunning && (
        <div style={{ background: "rgba(245,197,24,0.12)", border: "1px solid rgba(245,197,24,0.3)", borderRadius: "10px", padding: "0.6rem 1rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
          <span style={{ color: "#f5c518" }}>🚽 Toilet timer running</span>
          <span style={{ color: "#f5c518", fontWeight: 700 }}>{formatTime(timerElapsed)}</span>
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <h1 className="gold-text" style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 0.5rem 0", letterSpacing: "-1px" }}>Clog-A-Mole</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>PLUNGE THE POOPS! Avoid the ducks 🦆</p>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          <div className="glass-panel" style={{ padding: "12px 20px", minWidth: "100px" }}>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.6, marginBottom: "2px" }}>Score</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{score}</div>
          </div>

          {/* Multiplier badge */}
          <div className="glass-panel" style={{ padding: "12px 20px", minWidth: "100px", position: "relative", overflow: "hidden", border: multiplier > 1 ? "1px solid rgba(245,197,24,0.5)" : "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.6, marginBottom: "2px" }}>Multiplier</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: multiplier >= 4 ? "#ff6b6b" : multiplier >= 3 ? "#ff9f43" : multiplier >= 2 ? "#f5c518" : "white" }}>
              {multiplier}x
            </div>
            {showMultiplierBurst && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(245,197,24,0.25)", animation: "burstFade 0.8s ease-out forwards", borderRadius: "inherit" }} />
            )}
          </div>

          <div className="glass-panel" style={{ padding: "12px 20px", minWidth: "100px" }}>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.6, marginBottom: "2px" }}>Health</div>
            <div style={{ fontSize: "1.3rem", color: lives === 1 ? "#ff6b6b" : "white" }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} style={{ opacity: i < lives ? 1 : 0.2, marginRight: "2px" }}>🧻</span>
              ))}
            </div>
          </div>
        </div>

        {/* Streak indicator */}
        {isPlaying && streak > 0 && (
          <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#f5c518", fontWeight: 700 }}>
            🔥 {streak} hit streak{streak >= 4 ? ` — ${multiplier}x points!` : streak >= 2 ? " — keep going!" : ""}
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          maxWidth: "380px",
          margin: "0 auto",
          width: "100%",
          background: "rgba(0,0,0,0.2)",
          padding: "20px",
          borderRadius: "24px",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            onPointerDown={(e) => {
              e.preventDefault();
              whack(i);
            }}
            style={{
              aspectRatio: "1",
              background: "#16212d",
              borderRadius: "16px",
              border: "2px solid rgba(255,255,255,0.05)",
              boxShadow: "inset 0 4px 12px rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isPlaying ? "pointer" : "default",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ fontSize: "2.5rem", opacity: 0.3 }}>🚽</div>

            {activeMole?.index === i && (
              <div style={{
                position: "absolute",
                fontSize: "3.5rem",
                animation: "popIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                zIndex: 2,
                userSelect: "none",
                pointerEvents: "none"
              }}>
                {activeMole.type === "poop" ? "💩" : "🦆"}
              </div>
            )}

            {flushingMole === i && (
              <div style={{
                position: "absolute",
                fontSize: "3.5rem",
                animation: "flushAway 0.5s ease-in forwards",
                zIndex: 1,
                userSelect: "none",
                pointerEvents: "none"
              }}>
                💩
              </div>
            )}
          </div>
        ))}
      </div>

      {!isPlaying && !gameOver && (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <button
            onClick={startGame}
            className="gold-button"
            style={{ padding: "18px 48px", fontSize: "1.3rem", borderRadius: "16px", fontWeight: 800, boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }}
          >
            Start Plunging!
          </button>
          <div style={{ marginTop: "1.5rem", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
            Tap Poops (10pts × streak) | Don't miss! | Avoid Ducks (-1 Life)
          </div>
          <div style={{ marginTop: "0.5rem", color: "rgba(245,197,24,0.6)", fontSize: "0.8rem" }}>
            4 hits = 2x · 7 hits = 3x · 10 hits = 4x 🔥
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          70% { transform: scale(1.1) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes flushAway {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          40% { transform: scale(0.8) rotate(180deg); }
          100% { transform: scale(0) rotate(720deg); opacity: 0; filter: blur(5px); }
        }
        @keyframes burstFade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .gold-button {
          background: linear-gradient(135deg, #ffd700, #b8860b);
          color: #0b0710;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .gold-button:active { transform: scale(0.95); }
      `}</style>
    </div>
  );
}
