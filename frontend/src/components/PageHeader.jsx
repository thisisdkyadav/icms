function PageHeader({ title, subtitle, children }) {
    return (
        <div className="page-header">
            <div className="page-header__left">
                <h1 className="page-header__title">{title}</h1>
                {subtitle && <p className="page-header__sub">{subtitle}</p>}
            </div>
            {children && <div className="page-header__actions">{children}</div>}
        </div>
    );
}

export default PageHeader;
