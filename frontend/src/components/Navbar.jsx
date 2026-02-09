import { useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">ICMS</div>
            <div className="navbar-user">
                <span>{user.name} ({user.role})</span>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
            </div>
        </nav>
    );
}

export default Navbar;
