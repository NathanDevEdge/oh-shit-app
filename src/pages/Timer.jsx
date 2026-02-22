import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Play, Square } from 'lucide-react';

const Timer = () => {
    const [user, setUser] = useState({ salary: 0, salaryType: 'hourly' });
    const [isActive, setIsActive] = useState(false);
    const [elapsed, setElapsed] = useState(0); // in seconds
    const [earned, setEarned] = useState(0); // in dollars
    const navigate = useNavigate();
    const timerRef = useRef(null);

    // Confetti/Animation triggers could go here

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/');
            return;
        }
        const u = JSON.parse(storedUser);
        setUser(u);

        // Check for active timer in local storage to resume
        const activeSession = localStorage.getItem('active_session_start');
        if (activeSession) {
            const start = parseInt(activeSession, 10);
            const now = Date.now();
            const diffSeconds = (now - start) / 1000;
            setElapsed(diffSeconds);
            setIsActive(true);
            startTimer(start);
        }

        return () => clearInterval(timerRef.current);
    }, [navigate]);

    const moneyPerSecond = () => {
        let hourly = user.salary;
        if (user.salaryType === 'yearly') {
            hourly = user.salary / 2080; // Standard 40hr * 52wk
        }
        return hourly / 3600;
    };

    const startTimer = (startTimeParam = null) => {
        const mps = moneyPerSecond();
        if (mps <= 0) {
            alert("Please update your salary in the Profile tab first to see earnings!");
            navigate('/profile');
            return;
        }

        if (!isActive) {
            setIsActive(true);
            const startTime = startTimeParam || Date.now();
            if (!startTimeParam) {
                localStorage.setItem('active_session_start', startTime.toString());
            }

            timerRef.current = setInterval(() => {
                const diffSeconds = (Date.now() - startTime) / 1000;
                setElapsed(diffSeconds);
                setEarned(diffSeconds * mps);
            }, 50); // update often for smooth decimal counter
        }
    };

    const stopTimer = () => {
        setIsActive(false);
        clearInterval(timerRef.current);
        localStorage.removeItem('active_session_start');

        if (earned > 0) {
            const history = JSON.parse(localStorage.getItem(`history_${user.email}`) || '[]');
            history.push({
                date: new Date().toISOString(),
                duration: Math.floor(elapsed),
                earned: earned
            });
            localStorage.setItem(`history_${user.email}`, JSON.stringify(history));
        }

        // Reset
        setElapsed(0);
        setEarned(0);
        navigate('/dashboard');
    };

    return (
        <div style={{ padding: '1rem', paddingBottom: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)' }}>

            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                    {isActive ? 'You are currently earning:' : 'Ready to go?'}
                </h2>

                <div className="glass-panel" style={{ padding: '2rem 1rem', width: '300px', margin: '0 auto', border: isActive ? '1px solid var(--gold-primary)' : '1px solid var(--glass-border)', boxShadow: isActive ? '0 0 30px var(--gold-glow)' : 'none', transition: 'all 0.5s' }}>
                    <h1 style={{ fontSize: '4rem', margin: '0', color: 'var(--gold-primary)', fontWeight: 800, fontFamily: 'monospace' }}>
                        ${earned.toFixed(4)}
                    </h1>
                    <p style={{ margin: '16px 0 0 0', color: 'var(--success)', fontFamily: 'monospace', fontSize: '1.2rem' }}>
                        +{moneyPerSecond().toFixed(4)} / sec
                    </p>
                    <p style={{ margin: '8px 0 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                        {Math.floor(elapsed / 60).toString().padStart(2, '0')}:{(Math.floor(elapsed) % 60).toString().padStart(2, '0')}
                    </p>
                </div>
            </div>

            {!isActive ? (
                <button className="btn btn-primary" onClick={() => startTimer()} style={{ padding: '24px 48px', fontSize: '1.5rem', borderRadius: '50px', background: 'linear-gradient(135deg, var(--success), #00c853)', boxShadow: '0 10px 30px rgba(0,230,118,0.4)', color: '#000' }}>
                    <Play fill="#000" size={32} /> Gotta Go!
                </button>
            ) : (
                <button className="btn btn-danger" onClick={stopTimer} style={{ padding: '24px 48px', fontSize: '1.5rem', borderRadius: '50px', boxShadow: '0 10px 30px rgba(255,82,82,0.4)' }}>
                    <Square fill="#fff" size={32} /> Im Finished!
                </button>
            )}

            {isActive && (
                <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                    <p className="subtitle" style={{ marginBottom: '16px' }}>Bored? Play a quick game!</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/minigame/clog" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Clog-A-Mole</Link>
                        <Link to="/minigame/toss" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Paper Toss</Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Timer;
