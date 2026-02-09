import { Navigate, Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function Layout() {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="layout">
            <Navbar />
            <div className="layout-body">
                <Sidebar />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default Layout;
