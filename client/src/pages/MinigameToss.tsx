import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function MinigameToss() {
  const [, navigate] = useLocation();
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [message, setMessage] = useState("");
  const animationRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const speedRef = useRef(2);
  const directionRef = useRef(1);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.email) {
      navigate("/");
      return;
    }
    const savedScore = localStorage.getItem(`toss_highscore_${user.email}`);
    if (savedScore) setHighScore(parseInt(savedScore, 10));
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [navigate]);

  const animate = () => {
    positionRef.current += speedRef.current * directionRef.current;
    if (positionRef.current > 100 || positionRef.current < -100) {
      directionRef.current *= -1;
      positionRef.current += speedRef.current * directionRef.current;
    }
    setPosition(positionRef.current);
    animationRef.current = requestAnimationFrame(animate);
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setMessage("");
    speedRef.current = 2;
    positionRef.current = 0;
    directionRef.current = 1;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
  };

  const throwPaper = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsPlaying(false);
    const accuracy = Math.abs(positionRef.current);

    if (accuracy < 10) {
      setScore((s) => {
        const newScore = s + 50;
        setMessage("Perfect Toss! +50");
        speedRef.current += 1.5;
        setTimeout(() => {
          setIsPlaying(true);
          setMessage("");
          positionRef.current = 0;
          animationRef.current = requestAnimationFrame(animate);
        }, 1500);
        return newScore;
      });
    } else if (accuracy < 30) {
      setScore((s) => {
        const newScore = s + 20;
        setMessage("Good Toss! +20");
        speedRef.current += 0.5;
        setTimeout(() => {
          setIsPlaying(true);
          setMessage("");
          positionRef.current = 0;
          animationRef.current = requestAnimationFrame(animate);
        }, 1500);
        return newScore;
      });
    } else {
      setScore((s) => {
        setMessage(`Missed! Final Score: ${s}`);
        if (s > highScore) {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          setHighScore(s);
          localStorage.setItem(`toss_highscore_${user.email}`, String(s));
        }
        return s;
      });
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
          Paper Toss
        </h1>
        <p style={{ color: "oklch(1 0 0 / 0.6)" }}>
          Aim for the center to land the paper in the bowl!
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", margin: "20px 0" }}>
          <div className="glass-panel" style={{ padding: "10px 20px" }}>
            Score: {score}
          </div>
          <div
            className="glass-panel"
            style={{ padding: "10px 20px", color: "oklch(0.85 0.17 85)" }}
          >
            High: {highScore}
          </div>
        </div>
      </div>

      {/* Game track */}
      <div
        className="glass-panel"
        style={{
          position: "relative",
          height: "60px",
          maxWidth: "400px",
          margin: "2rem auto",
          width: "100%",
          overflow: "hidden",
          background: "oklch(0 0 0 / 0.5)",
        }}
      >
        {/* Target zone */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: "60px",
            marginLeft: "-30px",
            background: "oklch(0.78 0.18 155 / 0.2)",
            borderLeft: "2px solid oklch(0.78 0.18 155)",
            borderRight: "2px solid oklch(0.78 0.18 155)",
          }}
        />
        {/* Moving ball */}
        <div
          style={{
            position: "absolute",
            left: `calc(50% + ${position}%)`,
            top: "10px",
            width: "40px",
            height: "40px",
            marginLeft: "-20px",
            background: "white",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            boxShadow: "0 0 10px oklch(1 0 0 / 0.5)",
          }}
        >
          🧻
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          minHeight: "40px",
          color: message.includes("Missed") ? "oklch(0.65 0.22 25)" : "oklch(0.85 0.17 85)",
          fontWeight: 600,
          fontSize: "1.2rem",
        }}
      >
        {message}
      </div>

      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        {isPlaying ? (
          <button
            onClick={throwPaper}
            style={{
              padding: "20px 40px",
              fontSize: "1.5rem",
              borderRadius: "50px",
              border: "none",
              background: "linear-gradient(135deg, oklch(0.85 0.17 85), oklch(0.65 0.14 75))",
              color: "oklch(0.1 0.02 290)",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            TOSS!
          </button>
        ) : (
          <button
            onClick={startGame}
            style={{
              padding: "16px 32px",
              fontSize: "1.2rem",
              borderRadius: "12px",
              border: "1px solid oklch(1 0 0 / 0.1)",
              background: "oklch(1 0 0 / 0.05)",
              color: "white",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {score === 0 ? "Start Game" : "Play Again"}
          </button>
        )}
      </div>
    </div>
  );
}
