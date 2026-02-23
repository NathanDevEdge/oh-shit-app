import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────
const GRAVITY = 0.45;
const FLAP_STRENGTH = -8.5;
const PIPE_WIDTH = 60;
const PIPE_GAP = 160; // vertical gap between top/bottom pipe
const PIPE_SPAWN_INTERVAL = 1800; // ms between pipes at start
const MIN_PIPE_SPAWN = 900; // ms floor
const BASE_SPEED = 2.8;
const MAX_SPEED = 6.5;
const BALL_RADIUS = 18;
const CANVAS_W = 360;
const CANVAS_H = 560;

const TIMER_ACTIVE_KEY = "toilet_timer_active";
const TIMER_KEY = "toilet_timer_start";

type GamePhase = "idle" | "playing" | "dead" | "gameover";

interface Pipe {
  x: number;
  gapY: number; // centre of the gap
  scored: boolean;
}

function formatTime(s: number) {
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

export default function MinigamePipePanic() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── UI state (React) ──────────────────────────────────────────────────────
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [finalScore, setFinalScore] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(0);

  // ── Game refs (avoid stale closures in rAF loop) ──────────────────────────
  const phaseRef = useRef<GamePhase>("idle");
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const birdYRef = useRef(CANVAS_H / 2);
  const birdVYRef = useRef(0);
  const birdRotRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const frameRef = useRef<number | null>(null);
  const lastPipeTimeRef = useRef(0);
  const gameSpeedRef = useRef(BASE_SPEED);
  const pipeIntervalRef = useRef(PIPE_SPAWN_INTERVAL);
  const deathCooldownRef = useRef(false);
  const flashRef = useRef(0); // frames of red flash after hit

  const submitMutation = trpc.minigames.submitScore.useMutation({
    onSuccess: () => toast.success("Score saved to leaderboard! 🏆"),
    onError: () => toast.error("Could not save score — are you logged in?"),
  });

  const { data: personalBests } = trpc.minigames.personalBests.useQuery();
  const prevBest = personalBests?.pipe_panic ?? 0;
  const isNewPB = phase === "gameover" && finalScore > 0 && finalScore > prevBest;

  // ── Toilet timer overlay ──────────────────────────────────────────────────
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

  // ── Drawing helpers ───────────────────────────────────────────────────────
  const drawBird = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, rot: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    // Body
    ctx.font = `${BALL_RADIUS * 2.2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("💩", 0, 0);
    ctx.restore();
  }, []);

  const drawPipe = useCallback((ctx: CanvasRenderingContext2D, pipe: Pipe, canvasH: number) => {
    const topH = pipe.gapY - PIPE_GAP / 2;
    const botY = pipe.gapY + PIPE_GAP / 2;
    const botH = canvasH - botY;

    // Top pipe body
    const topGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
    topGrad.addColorStop(0, "#2a4a2a");
    topGrad.addColorStop(0.4, "#3d7a3d");
    topGrad.addColorStop(1, "#1a2e1a");
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.roundRect(pipe.x + 4, 0, PIPE_WIDTH - 8, topH - 12, [0, 0, 4, 4]);
    ctx.fill();

    // Top pipe cap
    const capGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
    capGrad.addColorStop(0, "#3d7a3d");
    capGrad.addColorStop(0.4, "#5aaa5a");
    capGrad.addColorStop(1, "#2a4a2a");
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.roundRect(pipe.x, topH - 20, PIPE_WIDTH, 20, [0, 0, 6, 6]);
    ctx.fill();

    // Bottom pipe cap
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.roundRect(pipe.x, botY, PIPE_WIDTH, 20, [6, 6, 0, 0]);
    ctx.fill();

    // Bottom pipe body
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.roundRect(pipe.x + 4, botY + 12, PIPE_WIDTH - 8, botH - 12, [4, 4, 0, 0]);
    ctx.fill();

    // Pipe shine
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.roundRect(pipe.x + 8, 0, 8, topH - 12, [0, 0, 2, 2]);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(pipe.x + 8, botY + 12, 8, botH - 12, [2, 2, 0, 0]);
    ctx.fill();
  }, []);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Sewer tunnel background
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0d1117");
    bg.addColorStop(1, "#0a1a0a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle brick pattern
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    const brickH = 40;
    const brickW = 80;
    for (let row = 0; row < Math.ceil(h / brickH); row++) {
      const offset = (row % 2) * (brickW / 2);
      for (let col = -1; col < Math.ceil(w / brickW) + 1; col++) {
        ctx.strokeRect(col * brickW + offset, row * brickH, brickW, brickH);
      }
    }

    // Floor and ceiling lines
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w, h); ctx.stroke();
  }, []);

  // ── Game loop ─────────────────────────────────────────────────────────────
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // ── Physics ──────────────────────────────────────────────────────────
    if (phaseRef.current === "playing") {
      birdVYRef.current += GRAVITY;
      birdVYRef.current = Math.min(birdVYRef.current, 12); // terminal velocity
      birdYRef.current += birdVYRef.current;
      birdRotRef.current = Math.max(-0.4, Math.min(1.2, birdVYRef.current * 0.07));

      // Spawn pipes
      if (timestamp - lastPipeTimeRef.current > pipeIntervalRef.current) {
        const minGapY = PIPE_GAP / 2 + 40;
        const maxGapY = H - PIPE_GAP / 2 - 40;
        const gapY = Math.random() * (maxGapY - minGapY) + minGapY;
        pipesRef.current.push({ x: W + 10, gapY, scored: false });
        lastPipeTimeRef.current = timestamp;
      }

      // Move pipes
      pipesRef.current = pipesRef.current
        .map(p => ({ ...p, x: p.x - gameSpeedRef.current }))
        .filter(p => p.x + PIPE_WIDTH > -10);

      // Score pipes
      const birdX = W * 0.28;
      pipesRef.current.forEach(p => {
        if (!p.scored && p.x + PIPE_WIDTH < birdX) {
          p.scored = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
          // Ramp difficulty every 5 points
          const lvl = Math.floor(scoreRef.current / 5);
          gameSpeedRef.current = Math.min(MAX_SPEED, BASE_SPEED + lvl * 0.3);
          pipeIntervalRef.current = Math.max(MIN_PIPE_SPAWN, PIPE_SPAWN_INTERVAL - lvl * 80);
        }
      });

      // Collision detection
      if (!deathCooldownRef.current) {
        const birdLeft = birdX - BALL_RADIUS + 4;
        const birdRight = birdX + BALL_RADIUS - 4;
        const birdTop = birdYRef.current - BALL_RADIUS + 4;
        const birdBottom = birdYRef.current + BALL_RADIUS - 4;

        // Ceiling / floor
        const hitBoundary = birdTop <= 0 || birdBottom >= H;

        // Pipes
        const hitPipe = pipesRef.current.some(p => {
          const inXRange = birdRight > p.x + 4 && birdLeft < p.x + PIPE_WIDTH - 4;
          if (!inXRange) return false;
          const topPipeBottom = p.gapY - PIPE_GAP / 2;
          const botPipeTop = p.gapY + PIPE_GAP / 2;
          return birdTop < topPipeBottom || birdBottom > botPipeTop;
        });

        if (hitBoundary || hitPipe) {
          deathCooldownRef.current = true;
          flashRef.current = 12;
          livesRef.current -= 1;
          setLives(livesRef.current);

          if (livesRef.current <= 0) {
            phaseRef.current = "gameover";
            setPhase("gameover");
            setFinalScore(scoreRef.current);
            submitMutation.mutate({ gameId: "pipe_panic", score: scoreRef.current });
          } else {
            // Brief death pause then respawn
            phaseRef.current = "dead";
            setPhase("dead");
            setTimeout(() => {
              birdYRef.current = H / 2;
              birdVYRef.current = 0;
              birdRotRef.current = 0;
              pipesRef.current = [];
              lastPipeTimeRef.current = performance.now();
              deathCooldownRef.current = false;
              phaseRef.current = "playing";
              setPhase("playing");
              toast.error(`Life lost! ${livesRef.current} left 🧻`, { duration: 1200 });
            }, 900);
          }
        }
      }

      if (flashRef.current > 0) flashRef.current--;
    }

    // ── Draw ─────────────────────────────────────────────────────────────
    drawBackground(ctx, W, H);

    // Flash overlay on hit
    if (flashRef.current > 0) {
      ctx.fillStyle = `rgba(255,60,60,${flashRef.current / 12 * 0.4})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Pipes
    pipesRef.current.forEach(p => drawPipe(ctx, p, H));

    // Bird
    const birdX = W * 0.28;
    drawBird(ctx, birdX, birdYRef.current, birdRotRef.current);

    // Score text
    if (phaseRef.current === "playing" || phaseRef.current === "dead") {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 36px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(String(scoreRef.current), W / 2, 20);
    }

    // Idle overlay
    if (phaseRef.current === "idle") {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#f5c518";
      ctx.font = "bold 28px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TAP TO START", W / 2, H / 2);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "16px Outfit, sans-serif";
      ctx.fillText("Tap or click to flap!", W / 2, H / 2 + 40);
    }

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [drawBackground, drawBird, drawPipe, submitMutation]);

  // ── Start / restart ───────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    scoreRef.current = 0;
    livesRef.current = 3;
    birdYRef.current = CANVAS_H / 2;
    birdVYRef.current = 0;
    birdRotRef.current = 0;
    pipesRef.current = [];
    gameSpeedRef.current = BASE_SPEED;
    pipeIntervalRef.current = PIPE_SPAWN_INTERVAL;
    deathCooldownRef.current = false;
    flashRef.current = 0;
    lastPipeTimeRef.current = performance.now();
    setScore(0);
    setLives(3);
    setFinalScore(0);
    phaseRef.current = "playing";
    setPhase("playing");
  }, []);

  // ── Flap input ────────────────────────────────────────────────────────────
  const flap = useCallback(() => {
    if (phaseRef.current === "idle") {
      startGame();
      return;
    }
    if (phaseRef.current === "playing") {
      birdVYRef.current = FLAP_STRENGTH;
    }
  }, [startGame]);

  // ── Mount: start rAF loop + input listeners ───────────────────────────────
  useEffect(() => {
    frameRef.current = requestAnimationFrame(gameLoop);

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener("keydown", handleKey);
    };
  }, [gameLoop, flap]);

  // ─── Game Over Screen ─────────────────────────────────────────────────────
  if (phase === "gameover") {
    return (
      <div style={{ padding: "1rem 1rem 6rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <button
          onClick={() => navigate("/timer")}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem", padding: "10px 18px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontFamily: "Outfit, sans-serif", fontWeight: 600, cursor: "pointer" }}
        >
          <ArrowLeft size={18} /> Back to Timer
        </button>

        {timerRunning && (
          <div style={{ background: "rgba(245,197,24,0.12)", border: "1px solid rgba(245,197,24,0.3)", borderRadius: "10px", padding: "0.6rem 1rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
            <span style={{ color: "#f5c518" }}>🚽 Toilet timer running</span>
            <span style={{ color: "#f5c518", fontWeight: 700 }}>{formatTime(timerElapsed)}</span>
          </div>
        )}

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "5rem", marginBottom: "0.5rem" }}>💩</div>
          <h1 className="gold-text" style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 0.5rem 0" }}>Splat!</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem" }}>You hit a pipe. The turd has landed.</p>
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
          <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
            {finalScore >= 30 ? "🏆 Legendary Flusher!" : finalScore >= 15 ? "⭐ Solid run!" : finalScore >= 5 ? "Getting the hang of it!" : "Tough first flush!"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "320px", margin: "0 auto" }}>
          <button
            onClick={() => { setPhase("idle"); phaseRef.current = "idle"; startGame(); }}
            style={{ padding: "16px 32px", fontSize: "1.1rem", borderRadius: "14px", fontWeight: 800, background: "linear-gradient(135deg, #ffd700, #b8860b)", color: "#0b0710", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <RotateCcw size={20} /> Play Again
          </button>

          <button
            onClick={() => navigate("/leaderboard")}
            style={{ padding: "16px 32px", fontSize: "1rem", borderRadius: "14px", fontWeight: 700, border: "2px solid rgba(245,197,24,0.4)", background: "rgba(245,197,24,0.08)", color: "#f5c518", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <Trophy size={20} /> View Leaderboard
          </button>

          <button
            onClick={() => navigate("/timer")}
            style={{ padding: "16px 32px", fontSize: "1rem", borderRadius: "14px", fontWeight: 700, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <ArrowLeft size={20} /> Back to Timer
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Game Screen ─────────────────────────────────────────────────────
  return (
    <div style={{ padding: "1rem 1rem 6rem", maxWidth: "600px", margin: "0 auto" }}>
      <button
        onClick={() => navigate("/timer")}
        style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "1rem", padding: "10px 18px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontFamily: "Outfit, sans-serif", fontWeight: 600, cursor: "pointer" }}
      >
        <ArrowLeft size={18} /> Back to Timer
      </button>

      {timerRunning && (
        <div style={{ background: "rgba(245,197,24,0.12)", border: "1px solid rgba(245,197,24,0.3)", borderRadius: "10px", padding: "0.6rem 1rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
          <span style={{ color: "#f5c518" }}>🚽 Toilet timer running</span>
          <span style={{ color: "#f5c518", fontWeight: 700 }}>{formatTime(timerElapsed)}</span>
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <h1 className="gold-text" style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 0.25rem 0", letterSpacing: "-1px" }}>Pipe Panic</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", margin: "0 0 1rem 0" }}>Guide the turd through the sewer!</p>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <div className="glass-panel" style={{ padding: "10px 20px", minWidth: "90px" }}>
            <div style={{ fontSize: "0.65rem", textTransform: "uppercase", opacity: 0.5, marginBottom: "2px" }}>Score</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{score}</div>
          </div>
          <div className="glass-panel" style={{ padding: "10px 20px", minWidth: "90px" }}>
            <div style={{ fontSize: "0.65rem", textTransform: "uppercase", opacity: 0.5, marginBottom: "2px" }}>Lives</div>
            <div style={{ fontSize: "1.1rem" }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} style={{ opacity: i < lives ? 1 : 0.2, marginRight: "2px" }}>🧻</span>
              ))}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: "10px 20px", minWidth: "90px" }}>
            <div style={{ fontSize: "0.65rem", textTransform: "uppercase", opacity: 0.5, marginBottom: "2px" }}>Speed</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: score >= 15 ? "#ff6b6b" : score >= 10 ? "#ff9f43" : score >= 5 ? "#f5c518" : "white" }}>
              {score < 5 ? "😌" : score < 10 ? "😅" : score < 20 ? "😰" : "💀"}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        style={{ position: "relative", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", userSelect: "none", touchAction: "none" }}
        onPointerDown={(e) => { e.preventDefault(); flap(); }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: "block", width: "100%", height: "auto" }}
        />
      </div>

      <div style={{ textAlign: "center", marginTop: "0.75rem", color: "rgba(255,255,255,0.35)", fontSize: "0.8rem" }}>
        Tap canvas · Click · Space / ↑ key
      </div>
    </div>
  );
}
