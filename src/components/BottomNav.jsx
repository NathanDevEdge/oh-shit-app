import { Link, useLocation } from 'react-router-dom';
import { Home, Timer, Trophy, Settings } from 'lucide-react';

const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', icon: <Home size={24} />, label: 'Home' },
        { path: '/timer', icon: <Timer size={24} />, label: 'Gotta Go' },
        { path: '/leaderboard', icon: <Trophy size={24} />, label: 'Ranks' },
        { path: '/profile', icon: <Settings size={24} />, label: 'Profile' },
    ];

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(11, 7, 16, 0.9)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '12px 0 20px 0',
            zIndex: 1000
        }}>
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: isActive ? 'var(--gold-primary)' : 'rgba(255,255,255,0.5)',
                            transition: 'all 0.3s ease',
                            transform: isActive ? 'translateY(-4px)' : 'none'
                        }}
                    >
                        <div style={{
                            background: isActive ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                            padding: '8px',
                            borderRadius: '12px',
                            display: 'flex',
                            marginBottom: '4px'
                        }}>
                            {item.icon}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: isActive ? '600' : '400' }}>{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
};

export default BottomNav;
