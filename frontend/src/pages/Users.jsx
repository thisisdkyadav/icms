import { useState, useEffect } from 'react';
import { getAllUsers, createUser, deleteUser } from '../services/api';

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'admin' });
    const [error, setError] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

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
            loadUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await deleteUser(id);
            loadUsers();
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div className="users-page">
            <div className="page-header">
                <h1>User Management</h1>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                    {showForm ? 'Cancel' : '+ Add User'}
                </button>
            </div>

            {showForm && (
                <div className="form-card">
                    <h3>Create New User</h3>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="subadmin">SubAdmin</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="btn-primary">Create User</button>
                    </form>
                </div>
            )}

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user._id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td>
                                {user.role !== 'superadmin' && (
                                    <button onClick={() => handleDelete(user._id)} className="btn-danger btn-sm">
                                        Delete
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Users;
