import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const MinigameToss = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(-100); // percentage
    const [direction, setDirection] = useState(1);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const animationRef = useRef(null);
    const speedRef = useRef(3); // base speed

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.email) {
            navigate('/');
            return;
        }
        const savedScore = localStorage.getItem(`toss_highscore_${user.email}`);
        if (savedScore) setHighScore(parseInt(savedScore, 10));

        return () => cancelAnimationFrame(animationRef.current);
    }, [navigate]);

    const animate = () => {
        setPosition(prev => {
            let newPos = prev + (speedRef.current * direction);
            if (newPos > 100) {
                setDirection(-1);
                newPos = 100 - (newPos - 100);
            } else if (newPos < -100) {
                setDirection(1);
                newPos = -100 + (-100 - newPos);
            }
            return newPos;
        });
        animationRef.current = requestAnimationFrame(animate);
    };

    const startGame = () => {
        setIsPlaying(true);
        setScore(0);
        setMessage('');
        speedRef.current = 2; // start slower
        cancelAnimationFrame(animationRef.current);
        animate();
    };

    const throwPaper = () => {
        cancelAnimationFrame(animationRef.current);
        setIsPlaying(false);

        // Target is around 0. If position is close to 0, it's a hit.
        const accuracy = Math.abs(position);

        if (accuracy < 10) {
            // Bullseye
            setScore(s => s + 50);
            setMessage("Perfect Toss! +50");
            speedRef.current += 1.5; // Gets harder
            setTimeout(() => {
                setIsPlaying(true);
                animate();
                setMessage('');
            }, 1500);
        } else if (accuracy < 30) {
            // Good
            setScore(s => s + 20);
            setMessage("Good Toss! +20");
            speedRef.current += 0.5;
            setTimeout(() => {
                setIsPlaying(true);
                animate();
                setMessage('');
            }, 1500);
        } else {
            // Miss
            setMessage(`Missed! Final Score: ${score}`);
            if (score > highScore) {
                const user = JSON.parse(localStorage.getItem('user'));
                setHighScore(score);
                localStorage.setItem(`toss_highscore_${user.email}`, score);
            }
        }
    };

    return (
        <div style={{ padding: '1rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => navigate('/timer')} className="btn btn-secondary" style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}>
                <ArrowLeft size={20} /> Back to Timer
            </button>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 className="title" style={{ fontSize: '2rem' }}>Paper Toss</h1>
                <p className="subtitle">Aim for the center to land the paper in the bowl!</p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0' }}>
                    <div className="glass-panel" style={{ padding: '10px 20px' }}>Score: {score}</div>
                    <div className="glass-panel" style={{ padding: '10px 20px', color: 'var(--gold-primary)' }}>High: {highScore}</div>
                </div>
            </div>

            <div className="glass-panel" style={{
                position: 'relative',
                height: '60px',
                maxWidth: '400px',
                margin: '2rem auto',
                width: '100%',
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.5)'
            }}>
                {/* The Target Area */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '0',
                    bottom: '0',
                    width: '60px',
                    marginLeft: '-30px',
                    background: 'rgba(0, 230, 118, 0.2)',
                    borderLeft: '2px solid var(--success)',
                    borderRight: '2px solid var(--success)'
                }} />

                {/* The Moving Object */}
                <div style={{
                    position: 'absolute',
                    left: `calc(50% + ${position}%)`,
                    top: '10px',
                    width: '40px',
                    height: '40px',
                    marginLeft: '-20px',
                    background: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                }}>
                    🧻
                </div>
            </div>

            <div style={{ textAlign: 'center', minHeight: '40px', color: message.includes('Missed') ? 'var(--danger)' : 'var(--gold-primary)', fontWeight: 600, fontSize: '1.2rem' }}>
                {message}
            </div>

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                {isPlaying ? (
                    <button onClick={throwPaper} className="btn btn-primary" style={{ padding: '20px 40px', fontSize: '1.5rem', borderRadius: '50px' }}>
                        TOSS!
                    </button>
                ) : (
                    <button onClick={startGame} className="btn btn-secondary" style={{ padding: '16px 32px', fontSize: '1.2rem' }}>
                        {score === 0 ? 'Start Game' : 'Play Again'}
                    </button>
                )}
            </div>

        </div>
    );
};

export default MinigameToss;
