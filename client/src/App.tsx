import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import BottomNav from "./components/BottomNav";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Timer from "./pages/Timer";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import MinigameClog from "./pages/MinigameClog";
import MinigameToss from "./pages/MinigameToss";
import MinigamePipePanic from "./pages/MinigamePipePanic";
import MinigamesHub from "./pages/MinigamesHub";
import NotFound from "./pages/NotFound";

function Router() {
  const [location] = useLocation();
  const showNav = location !== "/" && location !== "/admin";

  return (
    <>
      <main style={{ minHeight: "100vh" }}>
        <div className="container" style={{ maxWidth: "600px", paddingTop: "1.5rem", paddingBottom: "6rem" }}>
          <Switch>
            <Route path="/" component={Login} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/timer" component={Timer} />
            <Route path="/leaderboard" component={Leaderboard} />
            <Route path="/profile" component={Profile} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/minigame/clog" component={MinigameClog} />
            <Route path="/minigame/toss" component={MinigameToss} />
            <Route path="/minigame/pipe-panic" component={MinigamePipePanic} />
            <Route path="/minigames" component={MinigamesHub} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      {showNav && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
