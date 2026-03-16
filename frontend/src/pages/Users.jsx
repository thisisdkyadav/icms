import { useState, useEffect } from 'react';
import { getAllUsers, createUser, deleteUser } from '../services/api';
import { usePage } from '../contexts/PageContext';
import Card from '../components/Card';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';

const IconUsers = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconKey = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78z" /></svg>;
const IconUser = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'admin' });
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const { setPage } = usePage();

    useEffect(() => { loadUsers(); }, []);

    useEffect(() => {
        setPage('User Management', `${users.length} users registered`,
            <button onClick={() => setShowForm(true)} className="btn-primary">+ Add User</button>
        );
    }, [users.length]);

    const loadUsers = async () => {
        try {
            const response = await getAllUsers();
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await createUser(formData);
            setFormData({ name: '', email: '', password: '', role: 'admin' });
            setShowForm(false);
            setToast({ message: 'User created successfully', type: 'success' });
            loadUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteUser(deleteTarget);
            setToast({ message: 'User deleted', type: 'success' });
            loadUsers();
        } catch (error) {
            setToast({ message: 'Failed to delete user', type: 'error' });
        } finally {
            setDeleteTarget(null);
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div> Loading...</div>;

    const admins = users.filter(u => u.role === 'admin').length;
    const subadmins = users.filter(u => u.role === 'subadmin').length;

    return (
        <div>
            <div className="stats-grid">
                <StatCard icon={<IconUsers />} label="Total Users" value={users.length} color="primary" />
                <StatCard icon={<IconKey />} label="Admins" value={admins} color="success" />
                <StatCard icon={<IconUser />} label="SubAdmins" value={subadmins} color="warning" />
            </div>

            <Card noPad>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id}>
                                    <td>{u.name}</td>
                                    <td>{u.email}</td>
                                    <td><Badge variant={u.role}>{u.role}</Badge></td>
                                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td>{u.role !== 'superadmin' && <button onClick={() => setDeleteTarget(u._id)} className="btn-danger btn-sm">Delete</button>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={showForm} onClose={() => { setShowForm(false); setError(''); }} title="Create New User">
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group"><label>Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full name" required /></div>
                        <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="user@example.com" required /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Password</label><input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Minimum 6 characters" required /></div>
                        <div className="form-group"><label>Role</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}><option value="admin">Admin</option><option value="subadmin">SubAdmin</option></select></div>
                    </div>
                    <div className="modal-form-actions">
                        <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="btn-primary">Create User</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete User" message="This will permanently delete this user account. This action cannot be undone." confirmText="Delete User" confirmVariant="danger" />

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
}

export default Users;
