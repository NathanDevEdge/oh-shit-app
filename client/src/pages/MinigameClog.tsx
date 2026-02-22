import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function MinigameClog() {
  const [, navigate] = useLocation();
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMole, setActiveMole] = useState<number | null>(null);
  const gameInterval = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.email) {
      navigate("/");
      return;
    }
    const savedScore = localStorage.getItem(`clog_highscore_${user.email}`);
    if (savedScore) setHighScore(parseInt(savedScore, 10));
    return () => {
      if (gameInterval.current) clearTimeout(gameInterval.current);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [navigate]);

  const popMole = () => {
    const time = Math.random() * 600 + 600;
    const hole = Math.floor(Math.random() * 9);
    setActiveMole(hole);
    gameInterval.current = setTimeout(() => {
      if (isPlayingRef.current) popMole();
    }, time);
  };

  const endGame = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setActiveMole(null);
    if (timerInterval.current) clearInterval(timerInterval.current);
    if (gameInterval.current) clearTimeout(gameInterval.current);
    setScore((prev) => {
      if (prev > highScore) {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setHighScore(prev);
        localStorage.setItem(`clog_highscore_${user.email}`, String(prev));
      }
      return prev;
    });
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    isPlayingRef.current = true;
    setIsPlaying(true);
    timerInterval.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    popMole();
  };

  const whack = (index: number) => {
    if (index === activeMole && isPlayingRef.current) {
      setScore((s) => s + 10);
      setActiveMole(null);
      if (gameInterval.current) clearTimeout(gameInterval.current);
      popMole();
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <button
        onClick={() => navigate("/timer")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          alignSelf: "flex-start",
          marginBottom: "1rem",
          padding: "10px 18px",
          borderRadius: "12px",
          border: "1px solid oklch(1 0 0 / 0.1)",
          background: "oklch(1 0 0 / 0.05)",
          color: "white",
          fontFamily: "Outfit, sans-serif",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <ArrowLeft size={18} /> Back to Timer
      </button>

      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1
          className="gold-text"
          style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 1rem 0" }}
        >
          Clog-A-Mole
        </h1>
        <div style={{ display: "flex", justifyContent: "space-around", margin: "20px 0" }}>
          <div className="glass-panel" style={{ padding: "10px 20px" }}>
            Score: {score}
          </div>
          <div
            className="glass-panel"
            style={{
              padding: "10px 20px",
              color: timeLeft <= 5 ? "oklch(0.65 0.22 25)" : "white",
            }}
          >
            Time: {timeLeft}s
          </div>
          <div
            className="glass-panel"
            style={{ padding: "10px 20px", color: "oklch(0.85 0.17 85)" }}
          >
            High: {highScore}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "15px",
          maxWidth: "360px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            onClick={() => whack(i)}
            style={{
              aspectRatio: "1",
              background: "oklch(0 0 0 / 0.5)",
              borderRadius: "50%",
              border: "4px solid oklch(1 0 0 / 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isPlaying ? "pointer" : "default",
              overflow: "hidden",
            }}
          >
            {activeMole === i && (
              <div style={{ fontSize: "3.5rem", animation: "pop 0.3s ease-out" }}>💩</div>
            )}
          </div>
        ))}
      </div>

      {!isPlaying && (
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <button
            onClick={startGame}
            style={{
              padding: "16px 32px",
              fontSize: "1.2rem",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, oklch(0.85 0.17 85), oklch(0.65 0.14 75))",
              color: "oklch(0.1 0.02 290)",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {timeLeft === 0 ? "Play Again" : "Start Game"}
          </button>
        </div>
      )}

      <style>{`
        @keyframes pop {
          0% { transform: translateY(50px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
