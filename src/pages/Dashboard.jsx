import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [sessionHistory, setSessionHistory] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        const history = JSON.parse(localStorage.getItem(`history_${parsedUser.email}`) || '[]');
        setSessionHistory(history);
    }, [navigate]);

    if (!user) return <div style={{ padding: '2rem' }}>Loading...</div>;

    const totalEarned = sessionHistory.reduce((acc, curr) => acc + curr.earned, 0);

    return (
        <div style={{ padding: '1rem', paddingBottom: '80px' }}>
            <header style={{ marginBottom: '2rem', marginTop: '1rem' }}>
                <h1 className="title" style={{ textAlign: 'left', fontSize: '2rem' }}>Dashboard</h1>
                <p className="subtitle" style={{ textAlign: 'left', marginTop: '-8px' }}>Welcome back to the throne.</p>
            </header>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                <h3 style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>Total Earned on Toilet</h3>
                <h1 style={{ fontSize: '3rem', margin: '10px 0', color: 'var(--gold-primary)', fontWeight: 800 }}>
                    ${totalEarned.toFixed(2)}
                </h1>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--success)' }}>
                    Across {sessionHistory.length} sessions
                </p>
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Recent Sessions</h2>

            {sessionHistory.length === 0 ? (
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', opacity: 0.7 }}>
                    <p>You haven't tracked any sessions yet.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/timer')} style={{ marginTop: '1rem' }}>
                        Go Start Timer
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sessionHistory.slice().reverse().slice(0, 5).map((session, i) => (
                        <div key={i} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong style={{ fontSize: '1.1rem' }}>${session.earned.toFixed(2)}</strong>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                    {new Date(session.date).toLocaleDateString()}
                                </p>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                                {Math.floor(session.duration / 60)}m {session.duration % 60}s
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
