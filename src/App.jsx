import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Timer from './pages/Timer';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import MinigameClog from './pages/MinigameClog';
import MinigameToss from './pages/MinigameToss';

function App() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  // Simple check to hide nav on login or admin
  const showNav = location.pathname !== '/' && location.pathname !== '/admin';

  return (
    <>
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/timer" element={<Timer />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/minigame/clog" element={<MinigameClog />} />
          <Route path="/minigame/toss" element={<MinigameToss />} />
        </Routes>
      </main>

      {showNav && <BottomNav />}
    </>
  );
}

export default App;
