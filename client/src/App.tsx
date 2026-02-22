import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import BottomNav from "./components/BottomNav";
import { useLocation } from "wouter";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Timer from "./pages/Timer";
import Leaderboard from "./pages/Leaderboard";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import MinigameClog from "./pages/MinigameClog";
import MinigameToss from "./pages/MinigameToss";
import NotFound from "./pages/NotFound";

function Router() {
  const [location] = useLocation();
  const showNav = location !== "/" && location !== "/admin";

  return (
    <>
      <main className="container py-6 pb-24">
        <Switch>
          <Route path="/" component={Login} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/timer" component={Timer} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/profile" component={Profile} />
          <Route path="/minigame/clog" component={MinigameClog} />
          <Route path="/minigame/toss" component={MinigameToss} />
          <Route component={NotFound} />
        </Switch>
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
