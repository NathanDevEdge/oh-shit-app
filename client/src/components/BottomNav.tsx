import { Link, useLocation } from "wouter";
import { Home, Timer, Trophy, Settings } from "lucide-react";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/timer", icon: Timer, label: "Gotta Go" },
  { path: "/leaderboard", icon: Trophy, label: "Ranks" },
  { path: "/profile", icon: Settings, label: "Profile" },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around"
      style={{
        background: "oklch(0.1 0.02 290 / 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid oklch(1 0 0 / 0.1)",
        padding: "12px 0 20px 0",
      }}
    >
      {navItems.map(({ path, icon: Icon, label }) => {
        const isActive = location === path;
        return (
          <Link
            key={path}
            href={path}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textDecoration: "none",
              color: isActive ? "oklch(0.85 0.17 85)" : "oklch(1 0 0 / 0.5)",
              transition: "all 0.3s ease",
              transform: isActive ? "translateY(-4px)" : "none",
              gap: "4px",
            }}
          >
            <div
              style={{
                background: isActive ? "oklch(0.85 0.17 85 / 0.12)" : "transparent",
                padding: "8px",
                borderRadius: "12px",
                display: "flex",
              }}
            >
              <Icon size={24} />
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: isActive ? 600 : 400 }}>
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
