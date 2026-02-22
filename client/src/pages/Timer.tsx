import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { Play, Square } from "lucide-react";

interface User {
  email: string;
  salary: number;
  salaryType: "hourly" | "yearly";
}

interface Session {
  earned: number;
  duration: number;
  date: string;
}

export default function Timer() {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [earned, setEarned] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const moneyPerSecond = () => {
    if (!user) return 0;
    if (user.salaryType === "hourly") return user.salary / 3600;
    return user.salary / (365 * 24 * 3600);
  };

  const startTimer = () => {
    setIsActive(true);
    setElapsed(0);
    setEarned(0);
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        setEarned(next * moneyPerSecond());
        return next;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);

    if (!user || elapsed === 0) return;
    const session: Session = {
      earned,
      duration: elapsed,
      date: new Date().toISOString(),
    };
    const history: Session[] = JSON.parse(
      localStorage.getItem(`history_${user.email}`) || "[]"
    );
    history.push(session);
    localStorage.setItem(`history_${user.email}`, JSON.stringify(history));
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!user) return <div style={{ padding: "2rem" }}>Loading...</div>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        paddingTop: "1rem",
      }}
    >
      <header style={{ marginBottom: "2rem", width: "100%" }}>
        <h1
          className="gold-text"
          style={{ textAlign: "left", fontSize: "2rem", fontWeight: 800, margin: 0 }}
        >
          Timer
        </h1>
        <p style={{ textAlign: "left", marginTop: "4px", color: "oklch(1 0 0 / 0.6)" }}>
          {isActive ? "Ka-ching! You&apos;re earning." : "Hit the button when nature calls."}
        </p>
      </header>

      <div style={{ marginBottom: "2.5rem", width: "100%" }}>
        <h2
          style={{
            fontSize: "1.2rem",
            marginBottom: "1rem",
            color: "oklch(1 0 0 / 0.8)",
            fontWeight: 400,
          }}
        >
          {isActive ? "You are currently earning:" : "Ready to go?"}
        </h2>
        <div
          className="glass-panel"
          style={{
            padding: "2rem 1rem",
            maxWidth: "320px",
            margin: "0 auto",
            border: isActive
              ? "1px solid oklch(0.85 0.17 85)"
              : "1px solid oklch(1 0 0 / 0.1)",
            boxShadow: isActive ? "0 0 30px oklch(0.85 0.17 85 / 0.3)" : "none",
            transition: "all 0.5s",
          }}
        >
          <h1
            style={{
              fontSize: "3.5rem",
              margin: 0,
              color: "oklch(0.85 0.17 85)",
              fontWeight: 800,
              fontFamily: "monospace",
            }}
          >
            ${earned.toFixed(4)}
          </h1>
          <p
            style={{
              margin: "12px 0 0 0",
              color: "oklch(0.78 0.18 155)",
              fontFamily: "monospace",
              fontSize: "1.1rem",
            }}
          >
            +{moneyPerSecond().toFixed(4)} / sec
          </p>
          <p
            style={{
              margin: "8px 0 0 0",
              color: "oklch(1 0 0 / 0.5)",
              fontSize: "0.9rem",
              fontFamily: "monospace",
            }}
          >
            {Math.floor(elapsed / 60)
              .toString()
              .padStart(2, "0")}
            :{(Math.floor(elapsed) % 60).toString().padStart(2, "0")}
          </p>
        </div>
      </div>

      {!isActive ? (
        <button
          onClick={startTimer}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "20px 44px",
            fontSize: "1.4rem",
            borderRadius: "50px",
            border: "none",
            background: "linear-gradient(135deg, oklch(0.78 0.18 155), oklch(0.6 0.2 145))",
            boxShadow: "0 10px 30px oklch(0.78 0.18 155 / 0.4)",
            color: "oklch(0.1 0.02 290)",
            fontFamily: "Outfit, sans-serif",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Play fill="currentColor" size={28} /> Gotta Go!
        </button>
      ) : (
        <button
          onClick={stopTimer}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "20px 44px",
            fontSize: "1.4rem",
            borderRadius: "50px",
            border: "none",
            background: "oklch(0.65 0.22 25)",
            boxShadow: "0 10px 30px oklch(0.65 0.22 25 / 0.4)",
            color: "white",
            fontFamily: "Outfit, sans-serif",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Square fill="white" size={28} /> I&apos;m Finished!
        </button>
      )}

      {isActive && (
        <div style={{ marginTop: "3rem", textAlign: "center" }}>
          <p style={{ color: "oklch(1 0 0 / 0.6)", marginBottom: "16px" }}>
            Bored? Play a quick game!
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Link
              href="/minigame/clog"
              style={{
                padding: "12px 24px",
                borderRadius: "12px",
                border: "1px solid oklch(1 0 0 / 0.1)",
                background: "oklch(1 0 0 / 0.05)",
                color: "white",
                textDecoration: "none",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
              }}
            >
              Clog-A-Mole
            </Link>
            <Link
              href="/minigame/toss"
              style={{
                padding: "12px 24px",
                borderRadius: "12px",
                border: "1px solid oklch(1 0 0 / 0.1)",
                background: "oklch(1 0 0 / 0.05)",
                color: "white",
                textDecoration: "none",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
              }}
            >
              Paper Toss
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
