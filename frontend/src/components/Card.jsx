function Card({ children, title, icon, actions, className = '', noPad = false }) {
    return (
        <div className={`card ${className}`}>
            {(title || actions) && (
                <div className="card-header">
                    <div className="card-title">
                        {icon && <span className="card-icon">{icon}</span>}
                        {title && <h3>{title}</h3>}
                    </div>
                    {actions && <div className="card-actions">{actions}</div>}
                </div>
            )}
            <div className={`card-body ${noPad ? 'no-pad' : ''}`}>
                {children}
            </div>
        </div>
    );
}

export default Card;
