import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, getAllUsers } from '../services/api';

function Dashboard() {
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            if (user.role === 'superadmin') {
                // SuperAdmin sees users
                const response = await getAllUsers();
                setUsers(response.data);
            } else {
                // Admin/SubAdmin sees events
                const response = await getEvents();
                setEvents(response.data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="main-content"><p>Loading...</p></div>;

    // SuperAdmin Dashboard
    if (user.role === 'superadmin') {
        return (
            <div className="dashboard">
                <h1>SuperAdmin Dashboard</h1>
                <p>Welcome, {user.name}! You manage all system users.</p>

                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Users</h3>
                        <p className="stat-number">{users.length}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Admins</h3>
                        <p className="stat-number">{users.filter(u => u.role === 'admin').length}</p>
                    </div>
                    <div className="stat-card">
                        <h3>SubAdmins</h3>
                        <p className="stat-number">{users.filter(u => u.role === 'subadmin').length}</p>
                    </div>
                </div>

                <button onClick={() => navigate('/users')} className="btn-primary">
                    Manage Users
                </button>
            </div>
        );
    }

    // Admin/SubAdmin Dashboard
    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            <p>Welcome, {user.name}! You are logged in as <strong>{user.role}</strong>.</p>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Events</h3>
                    <p className="stat-number">{events.length}</p>
                </div>
                <div className="stat-card">
                    <h3>Your Role</h3>
                    <p className="stat-text">{user.role?.toUpperCase()}</p>
                </div>
            </div>

            <h2>Recent Events</h2>
            {events.length === 0 ? (
                <p>No events found. {user.role === 'admin' && 'Create your first event!'}</p>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Date</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.slice(0, 5).map(event => (
                            <tr key={event._id} onClick={() => navigate(`/events/${event._id}`)} style={{ cursor: 'pointer' }}>
                                <td>{event.name}</td>
                                <td>{new Date(event.date).toLocaleDateString()}</td>
                                <td>{event.description || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Dashboard;
