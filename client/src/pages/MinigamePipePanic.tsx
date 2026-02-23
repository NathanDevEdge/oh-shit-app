import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const GRAVITY = 0.45;
const FLAP_STRENGTH = -9;
const PIPE_WIDTH = 60;
const PIPE_GAP = 160;
const BIRD_SIZE = 28;
const INITIAL_PIPE_SPEED = 2.8;
const MAX_LIVES = 3;

type GameState = "idle" | "playing" | "dead" | "gameover";

interface Pipe {
  x: number;
  gapY: number;
  scored: boolean;
}

export default function MinigamePipePanic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>("idle");
  const birdYRef = useRef(0);
  const birdVelRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const frameRef = useRef(0);
  const pipeTimerRef = useRef(0);
  const animRef = useRef<number>(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLives, setDisplayLives] = useState(MAX_LIVES);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [finalScore, setFinalScore] = useState(0);
  const [isNewPB, setIsNewPB] = useState(false);
  const [, navigate] = useLocation();

  const submitScore = trpc.minigames.submitScore.useMutation();
  const { data: personalBests } = trpc.minigames.personalBests.useQuery();
  const utils = trpc.useUtils();

  const timerStart = localStorage.getItem("toiletTimerStart");
  const timerActive = timerStart !== null;
  const [timerDisplay, setTimerDisplay] = useState("");
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - parseInt(timerStart!)) / 1000);
      const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
      const s = (elapsed % 60).toString().padStart(2, "0");
      setTimerDisplay(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timerStart]);

  function getPipeSpeed() {
    return INITIAL_PIPE_SPEED + Math.min(scoreRef.current * 0.12, 4.5);
  }

  function getPipeInterval() {
    return Math.max(70, 120 - scoreRef.current * 2);
  }

  function resetBird(h: number) {
    birdYRef.current = h / 2;
    birdVelRef.current = 0;
  }

  const flapRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const BIRD_X = W * 0.25;
    birdYRef.current = H / 2;

    flapRef.current = () => {
      if (gameStateRef.current === "idle") {
        gameStateRef.current = "playing";
        setGameState("playing");
        scoreRef.current = 0;
        livesRef.current = MAX_LIVES;
        pipesRef.current = [];
        pipeTimerRef.current = 0;
        frameRef.current = 0;
        resetBird(H);
        setDisplayScore(0);
        setDisplayLives(MAX_LIVES);
        birdVelRef.current = FLAP_STRENGTH;
      } else if (gameStateRef.current === "playing") {
        birdVelRef.current = FLAP_STRENGTH;
      }
    };

    function handleDeath() {
      livesRef.current -= 1;
      setDisplayLives(livesRef.current);
      if (livesRef.current <= 0) {
        gameStateRef.current = "gameover";
        setGameState("gameover");
        const score = scoreRef.current;
        setFinalScore(score);
        submitScore.mutate({ gameId: "pipe_panic", score }, {
          onSuccess: () => utils.minigames.personalBests.invalidate(),
        });
      } else {
        gameStateRef.current = "dead";
        setGameState("dead");
        resetBird(H);
        pipesRef.current = [];
        setTimeout(() => {
          if (gameStateRef.current === "dead") {
            gameStateRef.current = "playing";
            setGameState("playing");
          }
        }, 800);
      }
    }

    function drawBird(x: number, y: number, vel: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.max(-0.4, Math.min(0.6, vel * 0.06)));
      ctx.font = `${BIRD_SIZE + 4}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("💩", 0, 0);
      ctx.restore();
    }

    function drawPipe(pipe: Pipe) {
      const topH = pipe.gapY - PIPE_GAP / 2;
      const botY = pipe.gapY + PIPE_GAP / 2;
      const botH = H - botY;
      const grad = (x: number) => {
        const g = ctx.createLinearGradient(x, 0, x + PIPE_WIDTH, 0);
        g.addColorStop(0, "#2a5a2a"); g.addColorStop(0.5, "#3d8b3d"); g.addColorStop(1, "#1a3a1a");
        return g;
      };
      ctx.fillStyle = grad(pipe.x);
      ctx.beginPath(); ctx.roundRect(pipe.x, 0, PIPE_WIDTH, Math.max(0, topH - 10), [0, 0, 4, 4]); ctx.fill();
      ctx.fillStyle = "#4aaa4a";
      ctx.beginPath(); ctx.roundRect(pipe.x - 5, topH - 22, PIPE_WIDTH + 10, 22, [4, 4, 0, 0]); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(pipe.x + 6, 0, 8, Math.max(0, topH - 10));
      ctx.fillStyle = grad(pipe.x);
      ctx.beginPath(); ctx.roundRect(pipe.x, botY + 10, PIPE_WIDTH, botH, [4, 4, 0, 0]); ctx.fill();
      ctx.fillStyle = "#4aaa4a";
      ctx.beginPath(); ctx.roundRect(pipe.x - 5, botY, PIPE_WIDTH + 10, 22, [0, 0, 4, 4]); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(pipe.x + 6, botY + 10, 8, botH);
    }

    function drawBg() {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0d1a0d"); bg.addColorStop(1, "#0a120a");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 1;
      const bW = 60, bH = 24;
      for (let row = 0; row * bH < H; row++) {
        const off = (row % 2) * (bW / 2);
        for (let col = -1; col * bW < W + bW; col++) {
          ctx.strokeRect(col * bW + off + 1, row * bH + 1, bW - 2, bH - 2);
        }
      }
      ctx.fillStyle = "rgba(50,180,50,0.12)";
      for (let i = 0; i < 5; i++) {
        const x = ((frameRef.current * 0.5 + i * 120) % (W + 40)) - 20;
        ctx.beginPath(); ctx.ellipse(x, 0, 6, 18, 0, 0, Math.PI * 2); ctx.fill();
      }
    }

    function loop() {
      frameRef.current++;
      const state = gameStateRef.current;
      drawBg();

      if (state === "playing" || state === "dead") {
        if (state === "playing") {
          birdVelRef.current += GRAVITY;
          birdYRef.current += birdVelRef.current;
          pipeTimerRef.current++;
          if (pipeTimerRef.current >= getPipeInterval()) {
            pipeTimerRef.current = 0;
            const gapY = H * 0.2 + Math.random() * H * 0.55;
            pipesRef.current.push({ x: W + 10, gapY, scored: false });
          }
          const speed = getPipeSpeed();
          pipesRef.current = pipesRef.current.filter(p => p.x > -PIPE_WIDTH - 20);
          pipesRef.current.forEach(p => {
            p.x -= speed;
            if (!p.scored && p.x + PIPE_WIDTH < BIRD_X) { p.scored = true; scoreRef.current++; setDisplayScore(scoreRef.current); }
          });
        }
        pipesRef.current.forEach(p => drawPipe(p));
        if (state === "playing") {
          const r = BIRD_SIZE / 2 - 4;
          if (birdYRef.current + r >= H || birdYRef.current - r <= 0) { handleDeath(); }
          for (const p of pipesRef.current) {
            if (BIRD_X + r > p.x + 4 && BIRD_X - r < p.x + PIPE_WIDTH - 4) {
              const topH = p.gapY - PIPE_GAP / 2;
              const botY = p.gapY + PIPE_GAP / 2;
              if (birdYRef.current - r < topH || birdYRef.current + r > botY) { handleDeath(); break; }
            }
          }
        }
        drawBird(BIRD_X, birdYRef.current, birdVelRef.current);
        if (state === "dead") { ctx.fillStyle = "rgba(255,50,50,0.25)"; ctx.fillRect(0, 0, W, H); }
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath(); ctx.roundRect(W / 2 - 40, 14, 80, 36, 8); ctx.fill();
        ctx.fillStyle = "#f5c518"; ctx.font = "bold 22px Outfit, sans-serif"; ctx.textAlign = "center";
        ctx.fillText(String(scoreRef.current), W / 2, 38);
        ctx.font = "20px serif"; ctx.textAlign = "right";
        for (let i = 0; i < MAX_LIVES; i++) {
          ctx.globalAlpha = i < livesRef.current ? 1 : 0.25;
          ctx.fillText("🧻", W - 12 - i * 28, 38);
        }
        ctx.globalAlpha = 1;
      } else if (state === "idle") {
        drawBird(BIRD_X, H / 2, 0);
        ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#f5c518"; ctx.font = "bold 24px Outfit, sans-serif"; ctx.textAlign = "center";
        ctx.fillText("PIPE PANIC", W / 2, H / 2 - 44);
        ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = "16px Outfit, sans-serif";
        ctx.fillText("Tap / Click / Space to start", W / 2, H / 2 - 4);
        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "13px Outfit, sans-serif";
        ctx.fillText("Navigate the sewer pipes!", W / 2, H / 2 + 26);
        ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "28px serif"; ctx.textAlign = "center";
        ctx.fillText("💩", BIRD_X, H / 2 + 70);
      }

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); flapRef.current(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const prevBest = personalBests?.pipe_panic ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1rem 1rem 6rem", minHeight: "100vh" }}>
      {timerActive && (
        <div style={{ width: "100%", maxWidth: 400, marginBottom: "0.75rem", background: "rgba(245,197,24,0.12)", border: "1px solid rgba(245,197,24,0.3)", borderRadius: "0.75rem", padding: "0.5rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#f5c518", fontSize: "0.85rem", fontWeight: 600 }}>🚽 Toilet timer running</span>
          <span style={{ color: "#f5c518", fontWeight: 700, fontFamily: "monospace" }}>{timerDisplay}</span>
        </div>
      )}
      <h1 className="gold-text" style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.25rem" }}>💩 Pipe Panic</h1>
      <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.75rem" }}>Tap to flap through the sewer pipes!</p>
      <div style={{ position: "relative", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 0 40px rgba(245,197,24,0.15)" }}>
        <canvas
          ref={canvasRef}
          width={380}
          height={480}
          onClick={() => flapRef.current()}
          style={{ display: "block", cursor: gameState === "gameover" ? "default" : "pointer", touchAction: "none" }}
          onTouchStart={(e) => { e.preventDefault(); flapRef.current(); }}
        />
        {gameState === "gameover" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem", padding: "1.5rem" }}>
            <div style={{ fontSize: "3rem" }}>💩</div>
            <h2 style={{ color: "#f5c518", fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>Game Over!</h2>
            <div style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 600 }}>Score: <span style={{ color: "#f5c518" }}>{finalScore}</span></div>
            {isNewPB ? (
              <div style={{ background: "linear-gradient(90deg,#f5c518,#e8a000)", color: "#1a0a00", borderRadius: "2rem", padding: "0.4rem 1.2rem", fontWeight: 800, fontSize: "0.9rem" }}>🏆 New Personal Best!</div>
            ) : prevBest > 0 ? (
              <div style={{ color: "#888", fontSize: "0.85rem" }}>Your best: {prevBest} pts</div>
            ) : null}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", width: "100%", maxWidth: "240px", marginTop: "0.5rem" }}>
              <button onClick={() => { gameStateRef.current = "idle"; setGameState("idle"); }} style={{ background: "linear-gradient(90deg,#f5c518,#e8a000)", color: "#1a0a00", border: "none", borderRadius: "0.75rem", padding: "0.75rem", fontWeight: 700, fontSize: "1rem", cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>🔄 Play Again</button>
              <button onClick={() => navigate("/leaderboard")} style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "0.75rem", padding: "0.75rem", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>🏆 View Leaderboard</button>
              <button onClick={() => navigate("/timer")} style={{ background: "rgba(255,255,255,0.05)", color: "#aaa", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "0.75rem", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>🚽 Back to Timer</button>
            </div>
          </div>
        )}
      </div>
      {gameState !== "gameover" && (
        <p style={{ color: "#555", fontSize: "0.78rem", marginTop: "0.75rem", textAlign: "center" }}>Tap · Click · Space · ↑ to flap &nbsp;|&nbsp; Avoid the pipes!</p>
      )}
    </div>
  );
}
