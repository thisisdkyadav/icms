import { NavLink } from 'react-router-dom';

function Sidebar() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <aside className="sidebar">
            <nav>
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                    Dashboard
                </NavLink>

                {/* SuperAdmin only sees User Management */}
                {user.role === 'superadmin' && (
                    <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>
                        User Management
                    </NavLink>
                )}

                {/* Admin and SubAdmin see Events and Attendance */}
                {(user.role === 'admin' || user.role === 'subadmin') && (
                    <>
                        <NavLink to="/events" className={({ isActive }) => isActive ? 'active' : ''}>
                            Events
                        </NavLink>
                        <NavLink to="/attendance" className={({ isActive }) => isActive ? 'active' : ''}>
                            Scan Attendance
                        </NavLink>
                    </>
                )}
            </nav>
        </aside>
    );
}

export default Sidebar;
