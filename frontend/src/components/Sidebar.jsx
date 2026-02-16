import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import ConfirmDialog from './ConfirmDialog';

function Sidebar() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();
    const [showLogout, setShowLogout] = useState(false);
    const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-nav">
                <div className="sidebar-section">
                    <div className="sidebar-label">Menu</div>
                    <nav>
                        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="nav-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                            </span>
                            Dashboard
                        </NavLink>

                        {user.role === 'superadmin' && (
                            <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>
                                <span className="nav-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                </span>
                                Users
                            </NavLink>
                        )}

                        {(user.role === 'admin' || user.role === 'subadmin') && (
                            <>
                                <NavLink to="/events" className={({ isActive }) => isActive ? 'active' : ''}>
                                    <span className="nav-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                    </span>
                                    Events
                                </NavLink>
                                <NavLink to="/attendance" className={({ isActive }) => isActive ? 'active' : ''}>
                                    <span className="nav-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                    </span>
                                    Attendance
                                </NavLink>
                            </>
                        )}
                    </nav>
                </div>
            </div>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{user.name}</span>
                        <span className="sidebar-user-role">{user.role}</span>
                    </div>
                    <ThemeToggle />
                </div>
                <button onClick={() => setShowLogout(true)} className="btn-sidebar-logout">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Logout
                </button>
            </div>

            <ConfirmDialog
                isOpen={showLogout}
                onClose={() => setShowLogout(false)}
                onConfirm={handleLogout}
                title="Logout"
                message="Are you sure you want to log out of your account?"
                confirmText="Logout"
                confirmVariant="danger"
            />
        </aside>
    );
}

export default Sidebar;
