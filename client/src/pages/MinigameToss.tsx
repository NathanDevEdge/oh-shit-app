import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Wind } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const TIMER_ACTIVE_KEY = "toilet_timer_active";
const TIMER_KEY = "toilet_timer_start";

// ─── Physics constants ────────────────────────────────────────────────────────
const GRAVITY = 0.35;
const BALL_RADIUS = 18;
const TOILET_WIDTH = 80;
const TOILET_HEIGHT = 60;

type Vec2 = { x: number; y: number };
type GameState = "idle" | "dragging" | "flying" | "scored" | "missed";

interface Ball {
  pos: Vec2;
  vel: Vec2;
  rotation: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function formatTime(s: number) {
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

export default function MinigameToss() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [wind, setWind] = useState(0); // negative = left, positive = right
  const [message, setMessage] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);

  // Timer overlay
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(0);

  // Refs for animation loop (avoid stale closures)
  const ballRef = useRef<Ball | null>(null);
  const dragStartRef = useRef<Vec2 | null>(null);
  const dragCurrentRef = useRef<Vec2 | null>(null);
  const gameStateRef = useRef<GameState>("idle");
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const windRef = useRef(0);
  const livesRef = useRef(3);
  const animFrameRef = useRef<number | null>(null);
  const canvasSizeRef = useRef({ w: 360, h: 560 });

  const submitMutation = trpc.minigames.submitScore.useMutation({
    onSuccess: () => toast.success("Score saved to leaderboard! 🏆"),
    onError: () => toast.error("Could not save score — are you logged in?"),
  });

  // ─── Toilet position (top-center area) ──────────────────────────────────────
  const getToiletPos = useCallback((): Vec2 => {
    const { w } = canvasSizeRef.current;
    return { x: w / 2, y: 110 };
  }, []);

  // ─── Ball start position (bottom-center) ────────────────────────────────────
  const getBallStart = useCallback((): Vec2 => {
    const { w, h } = canvasSizeRef.current;
    return { x: w / 2, y: h - 80 };
  }, []);

  // ─── Wind changes with score (harder = more wind) ────────────────────────────
  const generateWind = useCallback((currentScore: number) => {
    const maxWind = Math.min(0.5 + currentScore * 0.08, 3.5);
    const w = (Math.random() * 2 - 1) * maxWind;
    windRef.current = w;
    setWind(w);
  }, []);

  // ─── Reset ball to start ─────────────────────────────────────────────────────
  const resetBall = useCallback(() => {
    ballRef.current = {
      pos: { ...getBallStart() },
      vel: { x: 0, y: 0 },
      rotation: 0,
    };
    dragStartRef.current = null;
    dragCurrentRef.current = null;
    gameStateRef.current = "idle";
    setGameState("idle");
    setMessage("");
  }, [getBallStart]);

  // ─── Canvas resize ───────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      const w = Math.min(container.clientWidth, 420);
      const h = Math.min(window.innerHeight - 220, 580);
      canvas.width = w;
      canvas.height = h;
      canvasSizeRef.current = { w, h };
      resetBall();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resetBall]);

  // ─── Toilet timer overlay ────────────────────────────────────────────────────
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

  // ─── Drawing ─────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = canvasSizeRef.current;
    const toilet = getToiletPos();
    const ball = ballRef.current;

    // Background
    ctx.clearRect(0, 0, w, h);

    // Draw toilet bowl
    const tw = TOILET_WIDTH;
    const th = TOILET_HEIGHT;
    const tx = toilet.x - tw / 2;
    const ty = toilet.y - th / 2;

    // Toilet tank (back)
    ctx.fillStyle = "#e8e8e8";
    ctx.beginPath();
    ctx.roundRect(tx + 10, ty - 28, tw - 20, 28, 6);
    ctx.fill();
    ctx.strokeStyle = "#bbb";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Toilet seat rim
    ctx.fillStyle = "#f0f0f0";
    ctx.beginPath();
    ctx.ellipse(toilet.x, ty + th * 0.3, tw / 2 + 4, th * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Toilet bowl (opening — target zone)
    ctx.fillStyle = "#1a6fa8";
    ctx.beginPath();
    ctx.ellipse(toilet.x, ty + th * 0.3, tw / 2 - 6, th * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Water shimmer
    ctx.fillStyle = "rgba(100,180,255,0.35)";
    ctx.beginPath();
    ctx.ellipse(toilet.x, ty + th * 0.3, tw / 2 - 10, th * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Toilet base
    ctx.fillStyle = "#e8e8e8";
    ctx.beginPath();
    ctx.roundRect(tx + 5, ty + th * 0.45, tw - 10, th * 0.55, [0, 0, 10, 10]);
    ctx.fill();
    ctx.strokeStyle = "#bbb";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Wind arrow indicator
    if (windRef.current !== 0) {
      const arrowX = w / 2;
      const arrowY = toilet.y + th / 2 + 28;
      const arrowLen = Math.min(Math.abs(windRef.current) * 22, 60);
      const dir = windRef.current > 0 ? 1 : -1;
      ctx.save();
      ctx.strokeStyle = Math.abs(windRef.current) > 2 ? "#ff6b6b" : "#f5c518";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(arrowX - dir * arrowLen, arrowY);
      ctx.lineTo(arrowX + dir * arrowLen, arrowY);
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(arrowX + dir * arrowLen, arrowY);
      ctx.lineTo(arrowX + dir * (arrowLen - 10), arrowY - 7);
      ctx.moveTo(arrowX + dir * arrowLen, arrowY);
      ctx.lineTo(arrowX + dir * (arrowLen - 10), arrowY + 7);
      ctx.stroke();
      ctx.restore();
    }

    // Drag trajectory preview
    if (gameStateRef.current === "dragging" && dragStartRef.current && dragCurrentRef.current && ball) {
      const dx = dragStartRef.current.x - dragCurrentRef.current.x;
      const dy = dragStartRef.current.y - dragCurrentRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = dist > 0 ? Math.max(Math.min(dist * 0.22, 24), 10) : 10;
      const vx = dist > 0 ? (dx / dist) * speed : 0;
      const vy = dist > 0 ? (dy / dist) * speed : 0;

      ctx.save();
      ctx.setLineDash([5, 8]);
      ctx.strokeStyle = "rgba(245,197,24,0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let px = ball.pos.x;
      let py = ball.pos.y;
      let pvx = vx;
      let pvy = vy;
      ctx.moveTo(px, py);
      for (let i = 0; i < 28; i++) {
        px += pvx;
        py += pvy;
        pvy += GRAVITY;
        pvx += windRef.current * 0.04;
        ctx.lineTo(px, py);
        if (py < 0 || py > h) break;
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Ball
    if (ball) {
      ctx.save();
      ctx.translate(ball.pos.x, ball.pos.y);
      ctx.rotate(ball.rotation);
      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(3, 4, BALL_RADIUS, BALL_RADIUS * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ball body
      ctx.fillStyle = "#f5f0e8";
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      // Toilet paper texture lines
      ctx.strokeStyle = "rgba(180,160,130,0.6)";
      ctx.lineWidth = 1.2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-BALL_RADIUS + 4, i * 6);
        ctx.lineTo(BALL_RADIUS - 4, i * 6);
        ctx.stroke();
      }
      // Highlight
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.arc(-5, -5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Drag handle indicator at ball position
    if (gameStateRef.current === "idle" && ball) {
      ctx.save();
      ctx.strokeStyle = "rgba(245,197,24,0.6)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(ball.pos.x, ball.pos.y, BALL_RADIUS + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }, [getToiletPos]);

  // ─── Physics update loop ─────────────────────────────────────────────────────
  const updatePhysics = useCallback(() => {
    const ball = ballRef.current;
    if (!ball || gameStateRef.current !== "flying") return;
    const { w, h } = canvasSizeRef.current;
    const toilet = getToiletPos();

    // Apply velocity + gravity + wind
    ball.vel.x += windRef.current * 0.04;
    ball.vel.y += GRAVITY;
    ball.pos.x += ball.vel.x;
    ball.pos.y += ball.vel.y;
    ball.rotation += ball.vel.x * 0.08;

    // Check scored: ball enters toilet bowl ellipse
    const dx = ball.pos.x - toilet.x;
    const dy = ball.pos.y - (toilet.y + TOILET_HEIGHT * 0.3 - TOILET_HEIGHT / 2);
    const inBowlX = Math.abs(dx) < TOILET_WIDTH / 2 - 8;
    const inBowlY = Math.abs(dy) < TOILET_HEIGHT * 0.16;
    const movingDown = ball.vel.y > 0;

    if (inBowlX && inBowlY && movingDown) {
      // SCORED!
      gameStateRef.current = "scored";
      setGameState("scored");
      const newScore = scoreRef.current + 1;
      const newStreak = streakRef.current + 1;
      scoreRef.current = newScore;
      streakRef.current = newStreak;
      setScore(newScore);
      setStreak(newStreak);

      const msgs = ["Swish! 🎯", "In the bowl! 💩", "Perfect shot! ✨", "Nailed it! 🏆", "Flush! 🚽"];
      const streakMsgs = newStreak >= 3 ? [`${newStreak}x STREAK! 🔥`, `ON FIRE! 🔥x${newStreak}`] : msgs;
      setMessage(streakMsgs[Math.floor(Math.random() * streakMsgs.length)]);

      generateWind(newScore);
      setTimeout(() => resetBall(), 1200);
      return;
    }

    // Check missed: ball exits canvas
    if (ball.pos.y > h + 40 || ball.pos.x < -60 || ball.pos.x > w + 60 || ball.pos.y < -100) {
      gameStateRef.current = "missed";
      setGameState("missed");
      streakRef.current = 0;
      setStreak(0);

      const newLives = livesRef.current - 1;
      livesRef.current = newLives;
      setLives(newLives);

      if (newLives <= 0) {
        // Game over
        setGameOver(true);
        setMessage(`Game Over! Final Score: ${scoreRef.current}`);
        submitMutation.mutate({ gameId: "toss", score: scoreRef.current });
      } else {
        setMessage("Missed! 😬");
        setTimeout(() => resetBall(), 900);
      }
    }
  }, [getToiletPos, generateWind, resetBall, submitMutation]);

  // ─── Main animation loop ─────────────────────────────────────────────────────
  useEffect(() => {
    const loop = () => {
      updatePhysics();
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [updatePhysics, draw]);

  // ─── Input helpers ───────────────────────────────────────────────────────────
  const getCanvasPos = (clientX: number, clientY: number): Vec2 => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const isNearBall = (pos: Vec2): boolean => {
    const ball = ballRef.current;
    if (!ball) return false;
    const dx = pos.x - ball.pos.x;
    const dy = pos.y - ball.pos.y;
    // Large hitbox — entire lower quarter of canvas is grabbable near the ball
    return Math.sqrt(dx * dx + dy * dy) < BALL_RADIUS + 48;
  };

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (gameStateRef.current !== "idle") return;
    const pos = getCanvasPos(clientX, clientY);
    if (!isNearBall(pos)) return;
    dragStartRef.current = pos;
    dragCurrentRef.current = pos;
    gameStateRef.current = "dragging";
    setGameState("dragging");
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (gameStateRef.current !== "dragging") return;
    dragCurrentRef.current = getCanvasPos(clientX, clientY);
  };

  const handlePointerUp = () => {
    if (gameStateRef.current !== "dragging" || !dragStartRef.current || !dragCurrentRef.current || !ballRef.current) return;
    const dx = dragStartRef.current.x - dragCurrentRef.current.x;
    const dy = dragStartRef.current.y - dragCurrentRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      // Too short — cancel drag
      gameStateRef.current = "idle";
      setGameState("idle");
      return;
    }

    // Launch! Scale speed generously so even short drags can reach the toilet.
    // Minimum speed of 10 ensures the ball always has enough power.
    const rawSpeed = dist * 0.22;
    const speed = Math.max(Math.min(rawSpeed, 24), 10);
    ballRef.current.vel = {
      x: (dx / dist) * speed,
      y: (dy / dist) * speed,
    };
    gameStateRef.current = "flying";
    setGameState("flying");
  };

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => handlePointerDown(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handlePointerMove(e.clientX, e.clientY);
  const onMouseUp = () => handlePointerUp();

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    if (t) handlePointerDown(t.clientX, t.clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    if (t) handlePointerMove(t.clientX, t.clientY);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handlePointerUp();
  };

  // ─── Start / Restart ─────────────────────────────────────────────────────────
  const startGame = () => {
    scoreRef.current = 0;
    streakRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setStreak(0);
    setLives(3);
    setGameOver(false);
    setMessage("");
    generateWind(0);
    resetBall();
  };

  const windStrength = Math.abs(wind);
  const windLabel =
    windStrength < 0.3 ? "Calm" : windStrength < 1.2 ? "Breezy" : windStrength < 2.2 ? "Windy" : "Stormy";
  const windColor =
    windStrength < 0.3 ? "#88cc88" : windStrength < 1.2 ? "#f5c518" : windStrength < 2.2 ? "#ff9944" : "#ff4444";

  return (
    <div style={{ padding: "0.75rem 0.75rem 6rem", maxWidth: "440px", margin: "0 auto" }}>
      {/* Back button */}
      <button
        onClick={() => navigate("/timer")}
        style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          marginBottom: "0.75rem", padding: "8px 16px", borderRadius: "10px",
          border: "1px solid oklch(1 0 0 / 0.1)", background: "oklch(1 0 0 / 0.05)",
          color: "white", fontFamily: "Outfit, sans-serif", fontWeight: 600, cursor: "pointer",
          fontSize: "0.9rem",
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Toilet timer banner */}
      {timerRunning && (
        <div style={{
          background: "rgba(245,197,24,0.12)", border: "1px solid rgba(245,197,24,0.3)",
          borderRadius: "10px", padding: "0.5rem 1rem", marginBottom: "0.75rem",
          display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem",
        }}>
          <span style={{ color: "#f5c518" }}>🚽 Toilet timer running</span>
          <span style={{ color: "#f5c518", fontWeight: 700 }}>{formatTime(timerElapsed)}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h1 className="gold-text" style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0 }}>Paper Toss</h1>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* Lives */}
          <div style={{ display: "flex", gap: "3px" }}>
            {[...Array(3)].map((_, i) => (
              <span key={i} style={{ fontSize: "1.1rem", opacity: i < lives ? 1 : 0.2 }}>🧻</span>
            ))}
          </div>
          {/* Score */}
          <div className="glass-panel" style={{ padding: "6px 14px", fontSize: "1rem", fontWeight: 700 }}>
            {score}
          </div>
        </div>
      </div>

      {/* Wind indicator */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.5rem",
        padding: "6px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.25)",
        fontSize: "0.82rem",
      }}>
        <Wind size={14} color={windColor} />
        <span style={{ color: windColor, fontWeight: 600 }}>{windLabel}</span>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
          {wind > 0 ? `→ ${wind.toFixed(1)}` : wind < 0 ? `← ${Math.abs(wind).toFixed(1)}` : "No wind"}
        </span>
        {streak >= 3 && (
          <span style={{ marginLeft: "auto", color: "#ff9944", fontWeight: 700 }}>🔥 {streak}x streak</span>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{ width: "100%", borderRadius: "16px", overflow: "hidden", position: "relative", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <canvas
          ref={canvasRef}
          style={{ display: "block", touchAction: "none", cursor: gameState === "idle" ? "grab" : gameState === "dragging" ? "grabbing" : "default" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />

        {/* Message overlay */}
        {message && !gameOver && (
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            background: "rgba(0,0,0,0.75)", borderRadius: "12px", padding: "10px 20px",
            color: gameState === "scored" ? "#f5c518" : "#ff6b6b",
            fontWeight: 800, fontSize: "1.3rem", fontFamily: "Outfit, sans-serif",
            pointerEvents: "none", whiteSpace: "nowrap",
          }}>
            {message}
          </div>
        )}

        {/* Game over overlay */}
        {gameOver && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.82)",
            borderRadius: "16px", gap: "1rem",
          }}>
            <div style={{ fontSize: "3rem" }}>💩</div>
            <div className="gold-text" style={{ fontSize: "1.8rem", fontWeight: 800 }}>Game Over</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem" }}>Final Score: <strong style={{ color: "#f5c518" }}>{score}</strong></div>
            <button
              onClick={startGame}
              style={{
                padding: "12px 28px", borderRadius: "12px", border: "none",
                background: "linear-gradient(135deg, #f5c518, #e8a000)",
                color: "#1a0a00", fontFamily: "Outfit, sans-serif", fontWeight: 700,
                fontSize: "1rem", cursor: "pointer",
              }}
            >
              Play Again
            </button>
          </div>
        )}

        {/* Start overlay */}
        {!gameOver && score === 0 && gameState === "idle" && lives === 3 && (
          <div style={{
            position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.55)", fontSize: "0.85rem", fontFamily: "Outfit, sans-serif",
            pointerEvents: "none", whiteSpace: "nowrap",
          }}>
            Drag the ball to throw 👆
          </div>
        )}
      </div>

      {/* Start button (before first throw) */}
      {!gameOver && score === 0 && gameState === "idle" && lives === 3 && (
        <button
          onClick={startGame}
          style={{
            display: "block", width: "100%", marginTop: "1rem",
            padding: "14px", borderRadius: "12px", border: "none",
            background: "linear-gradient(135deg, #f5c518, #e8a000)",
            color: "#1a0a00", fontFamily: "Outfit, sans-serif", fontWeight: 700,
            fontSize: "1.1rem", cursor: "pointer",
          }}
        >
          Start Game 🚽
        </button>
      )}
    </div>
  );
}
