import { usePage } from '../contexts/PageContext';

function Navbar() {
    const { title, subtitle, actions } = usePage();

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <div className="navbar-brand">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.8" />
                        <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.4" />
                        <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.4" />
                        <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.6" />
                    </svg>
                    ICMS
                </div>
                {title && (
                    <>
                        <div className="navbar-sep"></div>
                        <div className="navbar-page">
                            <span className="navbar-page__title">{title}</span>
                            {subtitle && <span className="navbar-page__sub">{subtitle}</span>}
                        </div>
                    </>
                )}
            </div>
            {actions && <div className="navbar-actions">{actions}</div>}
        </nav>
    );
}

export default Navbar;
