import { createContext, useContext, useState, useCallback } from 'react';

const PageContext = createContext();

export function PageProvider({ children }) {
    const [pageInfo, setPageInfo] = useState({ title: '', subtitle: '', actions: null });

    const setPage = useCallback((title, subtitle, actions) => {
        setPageInfo({ title: title || '', subtitle: subtitle || '', actions: actions || null });
    }, []);

    return (
        <PageContext.Provider value={{ ...pageInfo, setPage }}>
            {children}
        </PageContext.Provider>
    );
}

export function usePage() {
    return useContext(PageContext);
}
