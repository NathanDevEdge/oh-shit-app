import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const [user, setUser] = useState({ email: '', salary: 0, salaryType: 'hourly' });
    const [saved, setSaved] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/');
            return;
        }
        setUser(JSON.parse(storedUser));
    }, [navigate]);

    const handleSave = (e) => {
        e.preventDefault();
        localStorage.setItem('user', JSON.stringify(user));

        const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        const existingIndex = allUsers.findIndex(u => u.email === user.email);
        if (existingIndex >= 0) {
            allUsers[existingIndex] = user;
        } else {
            allUsers.push(user);
        }
        localStorage.setItem('allUsers', JSON.stringify(allUsers));

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div style={{ padding: '1rem', paddingBottom: '80px' }}>
            <header style={{ marginBottom: '2rem', marginTop: '1rem' }}>
                <h1 className="title" style={{ textAlign: 'left', fontSize: '2rem' }}>Profile</h1>
                <p className="subtitle" style={{ textAlign: 'left', marginTop: '-8px' }}>Manage your income settings</p>
            </header>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                    Logged in as: <strong>{user.email}</strong>
                </p>

                <form onSubmit={handleSave}>
                    <label className="input-label">Salary Type</label>
                    <select
                        className="input-field"
                        value={user.salaryType}
                        onChange={(e) => setUser({ ...user, salaryType: e.target.value })}
                        style={{ appearance: 'none' }}
                    >
                        <option value="hourly" style={{ color: 'black' }}>Hourly ($/hr)</option>
                        <option value="yearly" style={{ color: 'black' }}>Yearly ($/yr)</option>
                    </select>

                    <label className="input-label">Amount ($)</label>
                    <input
                        type="number"
                        className="input-field"
                        value={user.salary}
                        onChange={(e) => setUser({ ...user, salary: Number(e.target.value) })}
                        min="0"
                        step="0.01"
                        required
                    />

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        {saved ? 'Saved!' : 'Save Settings'}
                    </button>
                </form>
            </div>

            <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%' }}>
                Logout
            </button>
        </div>
    );
};

export default Profile;
