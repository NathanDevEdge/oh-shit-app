import { useState, useEffect } from 'react';

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        // Generate leaderboard from allUsers and their histories
        const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');

        const ranks = allUsers.map(u => {
            const history = JSON.parse(localStorage.getItem(`history_${u.email}`) || '[]');
            const totalEarned = history.reduce((acc, curr) => acc + curr.earned, 0);
            const totalTime = history.reduce((acc, curr) => acc + curr.duration, 0);

            // Mock some avatar or username from email
            return {
                name: u.email.split('@')[0],
                earned: totalEarned,
                time: totalTime,
                isYou: u.email === JSON.parse(localStorage.getItem('user') || '{}').email
            };
        }).sort((a, b) => b.earned - a.earned);

        // Mock global users if array is small
        if (ranks.length < 5) {
            ranks.push({ name: 'ElonM', earned: 3450.50, time: 3600, isYou: false });
            ranks.push({ name: 'JeffB', earned: 2800.25, time: 4200, isYou: false });
            ranks.push({ name: 'AverageJoe', earned: 12.45, time: 1800, isYou: false });
            ranks.push({ name: 'ConstipatedPete', earned: 145.00, time: 24000, isYou: false });
            ranks.sort((a, b) => b.earned - a.earned);
        }

        setLeaderboard(ranks);
    }, []);

    return (
        <div style={{ padding: '1rem', paddingBottom: '80px', maxWidth: '600px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', marginTop: '1rem', textAlign: 'center' }}>
                <h1 className="title" style={{ fontSize: '2.5rem' }}>👑 Top Earners</h1>
                <p className="subtitle" style={{ marginTop: '-8px' }}>Who makes the most on the throne?</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {leaderboard.map((user, i) => (
                    <div
                        key={i}
                        className="glass-panel"
                        style={{
                            padding: '1.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            border: user.isYou ? '1px solid var(--gold-primary)' : '1px solid var(--glass-border)',
                            background: user.isYou ? 'rgba(255,215,0,0.1)' : 'var(--glass-bg)',
                            gap: '16px'
                        }}
                    >
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: i < 3 ? 'var(--gold-primary)' : 'rgba(255,255,255,0.5)', width: '30px', textAlign: 'center' }}>
                            #{i + 1}
                        </div>

                        <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '1.1rem', color: user.isYou ? 'var(--gold-primary)' : '#fff' }}>
                                {user.name} {user.isYou && '(You)'}
                            </strong>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                {Math.floor(user.time / 60)} mins total
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)' }}>
                                ${user.earned.toFixed(2)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
