import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const MinigameClog = () => {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [activeMole, setActiveMole] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [highScore, setHighScore] = useState(0);
    const navigate = useNavigate();
    const gameInterval = useRef(null);
    const timerInterval = useRef(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.email) {
            navigate('/');
            return;
        }
        const savedScore = localStorage.getItem(`clog_highscore_${user.email}`);
        if (savedScore) setHighScore(parseInt(savedScore, 10));

        return () => {
            clearInterval(gameInterval.current);
            clearInterval(timerInterval.current);
        };
    }, [navigate]);

    const startGame = () => {
        setScore(0);
        setTimeLeft(30);
        setIsPlaying(true);

        timerInterval.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    endGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        popMole();
    };

    const popMole = () => {
        // interval between 600ms and 1200ms
        const time = Math.random() * 600 + 600;
        const hole = Math.floor(Math.random() * 9);
        setActiveMole(hole);

        gameInterval.current = setTimeout(() => {
            if (isPlaying) popMole();
        }, time);
    };

    const endGame = () => {
        setIsPlaying(false);
        setActiveMole(null);
        clearInterval(timerInterval.current);
        clearTimeout(gameInterval.current);

        setScore(prev => {
            if (prev > highScore) {
                const user = JSON.parse(localStorage.getItem('user'));
                setHighScore(prev);
                localStorage.setItem(`clog_highscore_${user.email}`, prev);
            }
            return prev;
        });
    };

    const whack = (index) => {
        if (index === activeMole && isPlaying) {
            setScore(s => s + 10);
            setActiveMole(null);
            clearTimeout(gameInterval.current);
            popMole();
        }
    };

    return (
        <div style={{ padding: '1rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => navigate('/timer')} className="btn btn-secondary" style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}>
                <ArrowLeft size={20} /> Back to Timer
            </button>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 className="title" style={{ fontSize: '2rem' }}>Clog-A-Mole</h1>
                <div style={{ display: 'flex', justifyContent: 'space-around', margin: '20px 0' }}>
                    <div className="glass-panel" style={{ padding: '10px 20px' }}>Score: {score}</div>
                    <div className="glass-panel" style={{ padding: '10px 20px', color: timeLeft <= 5 ? 'var(--danger)' : 'white' }}>Time: {timeLeft}s</div>
                    <div className="glass-panel" style={{ padding: '10px 20px', color: 'var(--gold-primary)' }}>High: {highScore}</div>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '15px',
                maxWidth: '400px',
                margin: '0 auto',
                width: '100%'
            }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div
                        key={i}
                        onClick={() => whack(i)}
                        style={{
                            aspectRatio: '1',
                            background: 'rgba(0,0,0,0.5)',
                            borderRadius: '50%',
                            border: '4px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: isPlaying ? 'pointer' : 'default',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {activeMole === i && (
                            <div style={{
                                fontSize: '4rem',
                                animation: 'pop 0.3s ease-out'
                            }}>
                                💩
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {!isPlaying && (
                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                    <button onClick={startGame} className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.2rem' }}>
                        {timeLeft === 0 ? 'Play Again' : 'Start Game'}
                    </button>
                </div>
            )}

            <style>{`
        @keyframes pop {
          0% { transform: translateY(50px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
        </div>
    );
};

export default MinigameClog;
