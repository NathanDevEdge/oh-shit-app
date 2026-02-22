import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleAuth = (e) => {
        e.preventDefault();
        if (email === 'admin@devedge.com.au' && password === 'Adm1nP@assw0rd!') {
            localStorage.setItem('user', JSON.stringify({ email, role: 'admin' }));
            navigate('/admin');
            return;
        }

        if (isRegistering) {
            if (email && password.length >= 6) {
                const newUser = { email, salary: 0, salaryType: 'hourly', role: 'user' };
                // In reality we'd save to a DB, but we mock storing array of users for admin later
                const users = JSON.parse(localStorage.getItem('allUsers') || '[]');
                users.push(newUser);
                localStorage.setItem('allUsers', JSON.stringify(users));

                localStorage.setItem('user', JSON.stringify(newUser));
                navigate('/dashboard');
            } else {
                setError('Please enter a valid email and password (>5 chars)');
            }
        } else {
            // Mock Login
            if (email && password) {
                // Just mock login passing
                const existingUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
                const user = existingUsers.find(u => u.email === email) || { email, salary: 50, salaryType: 'hourly', role: 'user' };
                localStorage.setItem('user', JSON.stringify(user));
                navigate('/dashboard');
            } else {
                setError('Invalid credentials');
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 className="title">Oh Sh*t</h1>
                <p className="subtitle">Time is money, especially on the toilet.</p>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ marginTop: 0, marginBottom: '24px' }}>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>

                {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}

                <form onSubmit={handleAuth}>
                    <label className="input-label">Email</label>
                    <input
                        type="email"
                        className="input-field"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label className="input-label">Password</label>
                    <input
                        type="password"
                        className="input-field"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                        {isRegistering ? 'Sign Up' : 'Login'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                    {isRegistering ? 'Already have an account?' : 'Need an account?'} <br />
                    <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ marginTop: '8px', padding: '8px 16px', fontSize: '0.85rem' }}
                        onClick={() => setIsRegistering(!isRegistering)}>
                        {isRegistering ? 'Log in instead' : 'Sign up instead'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;
