import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, getAllUsers } from '../services/api';
import { usePage } from '../contexts/PageContext';
import StatCard from '../components/StatCard';
import Card from '../components/Card';

const IconUsers = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconKey = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zM15.5 7.5l-2.5 2.5" /></svg>;
const IconUser = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IconCalendar = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconTarget = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;

function Dashboard() {
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const { setPage } = usePage();

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (user.role === 'superadmin') {
            setPage(`Welcome, ${user.name}`, 'System administration', <button onClick={() => navigate('/users')} className="btn-primary">Manage Users</button>);
        } else {
            setPage(`Welcome, ${user.name}`, `Logged in as ${user.role}`, <button onClick={() => navigate('/events')} className="btn-primary">View Events</button>);
        }
    }, [user.name, user.role]);

    const loadData = async () => {
        try {
            if (user.role === 'superadmin') {
                const response = await getAllUsers();
                setUsers(response.data);
            } else {
                const response = await getEvents();
                setEvents(response.data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div> Loading...</div>;

    if (user.role === 'superadmin') {
        return (
            <div className="dashboard">
                <div className="stats-grid">
                    <StatCard icon={<IconUsers />} label="Total Users" value={users.length} color="primary" />
                    <StatCard icon={<IconKey />} label="Admins" value={users.filter(u => u.role === 'admin').length} color="success" />
                    <StatCard icon={<IconUser />} label="SubAdmins" value={users.filter(u => u.role === 'subadmin').length} color="warning" />
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="stats-grid">
                <StatCard icon={<IconCalendar />} label="Total Events" value={events.length} color="primary" />
                <StatCard icon={<IconTarget />} label="Your Role" value={user.role?.toUpperCase()} color="success" />
            </div>

            <h2 className="section-title">Recent Events</h2>
            {events.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon"><IconCalendar /></div>
                    <p>No events yet. {user.role === 'admin' && 'Create your first event!'}</p>
                </div>
            ) : (
                <Card noPad>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead><tr><th>Name</th><th>Date</th><th>Description</th></tr></thead>
                            <tbody>
                                {events.slice(0, 5).map(event => (
                                    <tr key={event._id} onClick={() => navigate(`/events/${event._id}`)} style={{ cursor: 'pointer' }}>
                                        <td>{event.name}</td>
                                        <td>{new Date(event.date).toLocaleDateString()}</td>
                                        <td>{event.description || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}

export default Dashboard;
