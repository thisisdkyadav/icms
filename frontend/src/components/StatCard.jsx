function StatCard({ label, value, icon, color = 'primary' }) {
    return (
        <div className={`stat-card stat-card--${color}`}>
            <div className="stat-card__icon">{icon}</div>
            <div className="stat-card__info">
                <span className="stat-card__value">{value}</span>
                <span className="stat-card__label">{label}</span>
            </div>
        </div>
    );
}

export default StatCard;
