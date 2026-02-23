import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

const TIMER_ACTIVE_KEY = "toilet_timer_active";
const TIMER_KEY = "toilet_timer_start";

export default function MinigameClog() {
  const [, navigate] = useLocation();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMole, setActiveMole] = useState<{ index: number, type: 'poop' | 'duck' } | null>(null);
  const [flushingMole, setFlushingMole] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(0);

  const gameInterval = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);

  const submitMutation = trpc.minigames.submitScore.useMutation({
    onSuccess: () => toast.success("Score saved to leaderboard! 🏆"),
    onError: () => toast.error("Could not save score — are you logged in?"),
  });

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

  const popMole = () => {
    if (!isPlayingRef.current) return;

    // Progression: faster as score increases
    const minDelay = Math.max(300, 1000 - Math.floor(scoreRef.current / 50) * 100);
    const maxDelay = Math.max(800, 1800 - Math.floor(scoreRef.current / 50) * 150);
    const timeToWait = Math.random() * (maxDelay - minDelay) + minDelay;

    gameInterval.current = setTimeout(() => {
      if (!isPlayingRef.current) return;

      const index = Math.floor(Math.random() * 9);
      const isDuck = Math.random() > 0.8; // 20% chance for a duck obstacle
      setActiveMole({ index, type: isDuck ? 'duck' : 'poop' });

      // If it's a poop, give limited time to whack or lose a life
      const visibleTime = Math.max(600, 1500 - Math.floor(scoreRef.current / 50) * 100);

      moleTimeout.current = setTimeout(() => {
        if (!isDuck && isPlayingRef.current) {
          // Missed a poop!
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
    setActiveMole(null);
    if (gameInterval.current) clearTimeout(gameInterval.current);
    if (moleTimeout.current) clearTimeout(moleTimeout.current);
    submitMutation.mutate({ gameId: "clog", score: scoreRef.current });
    toast.error("Game Over! 🚽", { description: `Final Score: ${scoreRef.current}` });
  };

  const startGame = () => {
    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    isPlayingRef.current = true;
    setIsPlaying(true);
    popMole();
  };

  const whack = (index: number) => {
    if (!isPlayingRef.current || !activeMole || activeMole.index !== index) return;

    if (activeMole.type === 'poop') {
      // Success!
      scoreRef.current += 10;
      setScore(scoreRef.current);
      setFlushingMole(index);
      setTimeout(() => setFlushingMole(null), 500);

      if (moleTimeout.current) clearTimeout(moleTimeout.current);
      setActiveMole(null);
      popMole();
    } else {
      // Hit a Duck!
      loseLife();
      if (moleTimeout.current) clearTimeout(moleTimeout.current);
      setActiveMole(null);
      popMole();
    }
  };

  const formatTime = (s: number) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

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

        <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
          <div className="glass-panel" style={{ padding: "12px 24px", minWidth: "120px" }}>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.6, marginBottom: "2px" }}>Score</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{score}</div>
          </div>
          <div className="glass-panel" style={{ padding: "12px 24px", minWidth: "120px" }}>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.6, marginBottom: "2px" }}>Health</div>
            <div style={{ fontSize: "1.5rem", color: lives === 1 ? "#ff6b6b" : "white" }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} style={{ opacity: i < lives ? 1 : 0.2, marginRight: "4px" }}>🧻</span>
              ))}
            </div>
          </div>
        </div>
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
              // use onPointerDown for faster mobile response than onClick
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
              cursor: isPlaying ? "url('https://em-content.zobj.net/source/apple/354/plunger_1faa1.png'), pointer" : "default",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* The Toilet Icon */}
            <div style={{ fontSize: "2.5rem", opacity: 0.3 }}>🚽</div>

            {/* The Mole (Poop or Duck) */}
            {activeMole?.index === i && (
              <div style={{
                position: "absolute",
                fontSize: "3.5rem",
                animation: "popIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                zIndex: 2,
                userSelect: "none",
                pointerEvents: "none"
              }}>
                {activeMole.type === 'poop' ? '💩' : '🦆'}
              </div>
            )}

            {/* Flush Effect */}
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

      {!isPlaying && (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <button
            onClick={startGame}
            className="gold-button"
            style={{
              padding: "18px 48px",
              fontSize: "1.3rem",
              borderRadius: "16px",
              fontWeight: 800,
              boxShadow: "0 10px 20px rgba(0,0,0,0.3)"
            }}
          >
            {lives <= 0 ? "Try Again" : "Start Plunging!"}
          </button>

          <div style={{ marginTop: "1.5rem", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
            Tap Poops (10pts) | Don't miss! | Avoid Ducks (-1 Life)
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
        .gold-button {
          background: linear-gradient(135deg, #ffd700, #b8860b);
          color: #0b0710;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .gold-button:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}
