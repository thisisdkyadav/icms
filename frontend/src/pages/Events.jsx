import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, createEvent, deleteEvent } from '../services/api';

function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', date: '', description: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const response = await getEvents();
            setEvents(response.data);
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await createEvent(formData);
            setFormData({ name: '', date: '', description: '' });
            setShowForm(false);
            loadEvents();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create event');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        try {
            await deleteEvent(id);
            loadEvents();
        } catch (error) {
            alert('Failed to delete event');
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div className="events-page">
            <div className="page-header">
                <h1>Events</h1>
                {user.role !== 'subadmin' && (
                    <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                        {showForm ? 'Cancel' : '+ Create Event'}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="form-card">
                    <h3>Create New Event</h3>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Event Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                            />
                        </div>
                        <button type="submit" className="btn-primary">Create Event</button>
                    </form>
                </div>
            )}

            {events.length === 0 ? (
                <p>No events found.</p>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(event => (
                            <tr key={event._id}>
                                <td>{event.name}</td>
                                <td>{new Date(event.date).toLocaleDateString()}</td>
                                <td>{event.description || '-'}</td>
                                <td>
                                    <button
                                        onClick={() => navigate(`/events/${event._id}`)}
                                        className="btn-secondary btn-sm"
                                    >
                                        Manage
                                    </button>
                                    {user.role !== 'subadmin' && (
                                        <button
                                            onClick={() => handleDelete(event._id)}
                                            className="btn-danger btn-sm"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Events;
