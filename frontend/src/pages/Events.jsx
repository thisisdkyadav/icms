import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, createEvent, deleteEvent } from '../services/api';
import { usePage } from '../contexts/PageContext';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';

const IconCalendar = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconClock = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;

function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [formData, setFormData] = useState({ name: '', date: '', description: '' });
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const [createConfirm, setCreateConfirm] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const { setPage } = usePage();

    useEffect(() => { loadEvents(); }, []);

    useEffect(() => {
        setPage('Events', `${events.length} events total`,
            user.role !== 'subadmin' ? <button onClick={() => setShowForm(true)} className="btn-primary">+ Create Event</button> : null
        );
    }, [events.length]);

    const loadEvents = async () => {
        try { const response = await getEvents(); setEvents(response.data); }
        catch (error) { console.error('Failed to load events:', error); }
        finally { setLoading(false); }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault(); setError('');
        if (!formData.name.trim() || !formData.date) { setError('Name and date are required'); return; }
        setCreateConfirm(true);
    };

    const handleCreateConfirmed = async () => {
        setCreateConfirm(false);
        try {
            await createEvent(formData);
            setFormData({ name: '', date: '', description: '' });
            setShowForm(false);
            setToast({ message: 'Event created successfully', type: 'success' });
            loadEvents();
        } catch (err) { setError(err.response?.data?.message || 'Failed to create event'); }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try { await deleteEvent(deleteTarget); setToast({ message: 'Event deleted', type: 'success' }); loadEvents(); }
        catch (error) { setToast({ message: 'Failed to delete event', type: 'error' }); }
        finally { setDeleteTarget(null); }
    };

    if (loading) return <div className="loading"><div className="spinner"></div> Loading...</div>;

    const upcoming = events.filter(e => new Date(e.date) >= new Date()).length;
    const past = events.filter(e => new Date(e.date) < new Date()).length;

    return (
        <div>
            <div className="stats-grid">
                <StatCard icon={<IconCalendar />} label="Total Events" value={events.length} color="primary" />
                <StatCard icon={<IconClock />} label="Upcoming" value={upcoming} color="success" />
                <StatCard icon={<IconCalendar />} label="Past" value={past} color="warning" />
            </div>

            {events.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
                    <p>No events found.</p>
                </div>
            ) : (
                <Card noPad>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead><tr><th>Name</th><th>Date</th><th>Description</th><th>Actions</th></tr></thead>
                            <tbody>
                                {events.map(event => (
                                    <tr key={event._id}>
                                        <td>{event.name}</td>
                                        <td>{new Date(event.date).toLocaleDateString()}</td>
                                        <td>{event.description || '—'}</td>
                                        <td className="actions-cell">
                                            <button onClick={() => navigate(`/events/${event._id}`)} className="btn-primary btn-sm">Manage</button>
                                            {user.role !== 'subadmin' && <button onClick={() => setDeleteTarget(event._id)} className="btn-danger btn-sm">Delete</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Modal isOpen={showForm} onClose={() => { setShowForm(false); setError(''); }} title="Create New Event">
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleFormSubmit}>
                    <div className="form-row">
                        <div className="form-group"><label>Event Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Conference name" required /></div>
                        <div className="form-group"><label>Date</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
                    </div>
                    <div className="form-group"><label>Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." rows="3" /></div>
                    <div className="modal-form-actions">
                        <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="btn-primary">Create Event</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog isOpen={createConfirm} onClose={() => setCreateConfirm(false)} onConfirm={handleCreateConfirmed} title="Create Event" message={`Create "${formData.name}" on ${formData.date}?`} confirmText="Create" />
            <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete Event" message="This will permanently delete this event and all participant data." confirmText="Delete Event" confirmVariant="danger" />

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
}

export default Events;
