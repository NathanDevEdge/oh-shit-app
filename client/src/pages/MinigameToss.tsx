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
  const [, setParticleTick] = useState(0);

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
  const splashRef = useRef<Array<{ x: number, y: number, vx: number, vy: number, life: number }>>([]);
  const animFrameRef = useRef<number | null>(null);
  const canvasSizeRef = useRef({ w: 360, h: 560 });

  const submitMutation = trpc.minigames.submitScore.useMutation({
    onSuccess: () => toast.success("Score saved to leaderboard! 🏆"),
    onError: () => toast.error("Could not save score — are you logged in?"),
  });

  // ─── Toilet position (top-center area) ──────────────────────────────────────
  const getToiletPos = useCallback((): Vec2 => {
    const { w } = canvasSizeRef.current;
    return { x: w / 2, y: 140 };
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

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Bathroom Tiles (Background)
    const tileSize = 60;
    const tileColor1 = "#2c3e50";
    const tileColor2 = "#34495e";

    // Floor (Perspective-ish)
    const horizon = h * 0.4;
    for (let y = horizon; y < h; y += tileSize / 2) {
      for (let x = 0; x < w; x += tileSize) {
        ctx.fillStyle = (Math.floor(x / tileSize) + Math.floor(y / (tileSize / 2))) % 2 === 0 ? tileColor1 : tileColor2;
        ctx.fillRect(x, y, tileSize, tileSize / 2);
      }
    }

    // Wall (Simple top part)
    ctx.fillStyle = "#16212d";
    ctx.fillRect(0, 0, w, horizon);

    // Grout lines
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, horizon);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = horizon; y <= h; y += tileSize / 2) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 2. Draw Window (Draft Source)
    const winW = 100;
    const winH = 80;
    const winX = windRef.current > 0 ? -20 : w - winW + 20; // Window on the side the wind is blowing FROM
    const winY = 40;

    // Window frame
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(winX, winY, winW, winH);
    ctx.strokeStyle = "#4a627a";
    ctx.strokeRect(winX, winY, winW, winH);

    // Window panes (Glowing slightly)
    ctx.fillStyle = "rgba(135, 206, 235, 0.2)";
    ctx.fillRect(winX + 8, winY + 8, winW / 2 - 12, winH / 2 - 12);
    ctx.fillRect(winX + winW / 2 + 4, winY + 8, winW / 2 - 12, winH / 2 - 12);
    ctx.fillRect(winX + 8, winY + winH / 2 + 4, winW / 2 - 12, winH / 2 - 12);
    ctx.fillRect(winX + winW / 2 + 4, winY + winH / 2 + 4, winW / 2 - 12, winH / 2 - 12);

    // 3. Draft Visuals (Moving Air Lines)
    if (Math.abs(windRef.current) > 0.2) {
      const airCount = Math.floor(Math.abs(windRef.current) * 8);
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      const time = Date.now() / 200;
      for (let i = 0; i < airCount; i++) {
        const offset = (i * 40 + time * 50 * Math.sign(windRef.current)) % w;
        const x = windRef.current > 0 ? offset : w - offset;
        const y = 50 + (i * 30) % (h - 100);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 30 * Math.sign(windRef.current), y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Draw Toilet (Better shading)
    const tw = TOILET_WIDTH + 10;
    const th = TOILET_HEIGHT + 10;
    const tx = toilet.x - tw / 2;
    const ty = toilet.y - th / 2;

    // Base Shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(toilet.x, ty + th, tw / 2, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Toilet tank (back)
    const gradientTank = ctx.createLinearGradient(tx, ty - 30, tx + tw, ty);
    gradientTank.addColorStop(0, "#ffffff");
    gradientTank.addColorStop(1, "#d0d0d0");
    ctx.fillStyle = gradientTank;
    ctx.beginPath();
    ctx.roundRect(tx + 15, ty - 35, tw - 30, 35, 8);
    ctx.fill();
    ctx.strokeStyle = "#999";
    ctx.stroke();

    // Toilet seat rim
    const gradientRim = ctx.createRadialGradient(toilet.x, ty + th * 0.3, 0, toilet.x, ty + th * 0.3, tw / 2);
    gradientRim.addColorStop(0, "#ffffff");
    gradientRim.addColorStop(1, "#e0e0e0");
    ctx.fillStyle = gradientRim;
    ctx.beginPath();
    ctx.ellipse(toilet.x, ty + th * 0.3, tw / 2 + 6, th * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#bbb";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bowl & Water
    ctx.fillStyle = "#2c3e50"; // Dark bowl depth
    ctx.beginPath();
    ctx.ellipse(toilet.x, ty + th * 0.3, tw / 2 - 4, th * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Water Shimmer
    const gradientWater = ctx.createRadialGradient(toilet.x, ty + th * 0.3, 5, toilet.x, ty + th * 0.3, tw / 2 - 8);
    gradientWater.addColorStop(0, "#4a90e2");
    gradientWater.addColorStop(1, "#1a6fa8");
    ctx.fillStyle = gradientWater;
    ctx.beginPath();
    ctx.ellipse(toilet.x, ty + th * 0.3, tw / 2 - 8, th * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. Drag trajectory preview
    if (gameStateRef.current === "dragging" && dragStartRef.current && dragCurrentRef.current && ball) {
      const dx = dragStartRef.current.x - dragCurrentRef.current.x;
      const dy = dragStartRef.current.y - dragCurrentRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = dist > 0 ? Math.max(Math.min(dist * 0.22, 24), 10) : 10;
      const vx = dist > 0 ? (dx / dist) * speed : 0;
      const vy = dist > 0 ? (dy / dist) * speed : 0;

      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(245,197,24,0.4)";
      ctx.beginPath();
      let px = ball.pos.x;
      let py = ball.pos.y;
      let pvx = vx;
      let pvy = vy;
      ctx.moveTo(px, py);
      for (let i = 0; i < 30; i++) {
        px += pvx;
        py += pvy;
        pvy += GRAVITY;
        pvx += windRef.current * 0.04;
        ctx.lineTo(px, py);
        if (py < 0 || py > h) break;
      }
      ctx.stroke();
      ctx.restore();
    }

    // 6. Ball (Toilet Paper with trailing bit)
    if (ball) {
      ctx.save();
      ctx.translate(ball.pos.x, ball.pos.y);
      ctx.rotate(ball.rotation);

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.ellipse(3, 8, BALL_RADIUS, BALL_RADIUS * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trailing paper bit (flappy)
      const flapTime = Date.now() / 150;
      const flapX = Math.sin(flapTime) * 4;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(-BALL_RADIUS, 0);
      ctx.quadraticCurveTo(-BALL_RADIUS - 10 + flapX, 10, -BALL_RADIUS - 5, 20);
      ctx.lineTo(-BALL_RADIUS + 5, 18);
      ctx.closePath();
      ctx.fill();

      // Main Roll
      const gradientRoll = ctx.createLinearGradient(-BALL_RADIUS, -BALL_RADIUS, BALL_RADIUS, BALL_RADIUS);
      gradientRoll.addColorStop(0, "#ffffff");
      gradientRoll.addColorStop(1, "#f0f0f0");
      ctx.fillStyle = gradientRoll;
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Roll hole
      ctx.fillStyle = "#ddd";
      ctx.beginPath();
      ctx.ellipse(0, 0, BALL_RADIUS * 0.2, BALL_RADIUS * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Texture lines
      ctx.strokeStyle = "rgba(0,0,0,0.05)";
      ctx.lineWidth = 1;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-BALL_RADIUS + 4, i * 8);
        ctx.lineTo(BALL_RADIUS - 4, i * 8);
        ctx.stroke();
      }

      ctx.restore();
    }

    // 7. Interactive touch area
    if (gameStateRef.current === "idle" && ball) {
      ctx.save();
      ctx.strokeStyle = "rgba(245,197,24,0.4)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(ball.pos.x, ball.pos.y, BALL_RADIUS + 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 8. Splash Particles
    splashRef.current.forEach((p) => {
      ctx.fillStyle = `rgba(135, 206, 235, ${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
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

      // Create splash particles
      for (let i = 0; i < 12; i++) {
        splashRef.current.push({
          x: toilet.x + (Math.random() * 20 - 10),
          y: toilet.y + TOILET_HEIGHT * 0.3 - 20,
          vx: Math.random() * 4 - 2,
          vy: -Math.random() * 5 - 2,
          life: 1.0
        });
      }

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

      // Update particles
      splashRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += GRAVITY * 0.5;
        p.life -= 0.02;
      });
      splashRef.current = splashRef.current.filter(p => p.life > 0);
      if (splashRef.current.length > 0) setParticleTick(t => t + 1);

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
            alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.88)",
            borderRadius: "16px", gap: "0.75rem", padding: "1.5rem",
          }}>
            <div style={{ fontSize: "3.5rem" }}>💩</div>
            <div className="gold-text" style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Game Over!</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>You ran out of paper.</div>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(245,197,24,0.2)", borderRadius: "12px", padding: "0.75rem 2rem", textAlign: "center", marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.5, marginBottom: "4px" }}>Final Score</div>
              <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#f5c518", lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                {score >= 20 ? "🏆 Incredible aim!" : score >= 10 ? "⭐ Nice shooting!" : "Keep practising!"}
              </div>
            </div>
            <button
              onClick={startGame}
              style={{
                width: "100%", padding: "12px 24px", borderRadius: "12px", border: "none",
                background: "linear-gradient(135deg, #ffd700, #b8860b)",
                color: "#0b0710", fontFamily: "Outfit, sans-serif", fontWeight: 800,
                fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              🔄 Play Again
            </button>
            <button
              onClick={() => navigate("/leaderboard")}
              style={{
                width: "100%", padding: "12px 24px", borderRadius: "12px",
                border: "2px solid rgba(245,197,24,0.4)", background: "rgba(245,197,24,0.08)",
                color: "#f5c518", fontFamily: "Outfit, sans-serif", fontWeight: 700,
                fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              🏆 View Leaderboard
            </button>
            <button
              onClick={() => navigate("/timer")}
              style={{
                width: "100%", padding: "12px 24px", borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.7)", fontFamily: "Outfit, sans-serif", fontWeight: 700,
                fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              ← Back to Timer
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
