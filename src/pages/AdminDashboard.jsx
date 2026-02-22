import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser || JSON.parse(storedUser).role !== 'admin') {
            navigate('/');
            return;
        }

        const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        setUsers(allUsers);
    }, [navigate]);

    const handleCreateUser = (e) => {
        e.preventDefault();
        if (newEmail && newPassword) {
            const newUser = { email: newEmail, salary: 0, salaryType: 'hourly', role: 'user' };
            const updatedUsers = [...users, newUser];
            localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
            setUsers(updatedUsers);
            setNewEmail('');
            setNewPassword('');
        }
    };

    const handleDelete = (email) => {
        const updatedUsers = users.filter(u => u.email !== email);
        localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
    };

    const handleLogoutAdmin = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="title" style={{ fontSize: '2rem', margin: 0 }}>Admin Panel</h1>
                <button onClick={handleLogoutAdmin} className="btn btn-secondary">Logout</button>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3>Create User Account</h3>
                <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label className="input-label">Email</label>
                        <input type="email" className="input-field" style={{ marginBottom: 0 }} value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label className="input-label">Password</label>
                        <input type="password" className="input-field" style={{ marginBottom: 0 }} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '46px' }}>Create</button>
                </form>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3>Manage Users ({users.length})</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '12px' }}>Email</th>
                                <th style={{ padding: '12px' }}>Salary</th>
                                <th style={{ padding: '12px' }}>Type</th>
                                <th style={{ padding: '12px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px' }}>{u.email}</td>
                                    <td style={{ padding: '12px', color: 'var(--gold-primary)' }}>${u.salary}</td>
                                    <td style={{ padding: '12px', textTransform: 'capitalize' }}>{u.salaryType}</td>
                                    <td style={{ padding: '12px' }}>
                                        <button onClick={() => handleDelete(u.email)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && <tr><td colSpan="4" style={{ padding: '12px', textAlign: 'center' }}>No users found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
