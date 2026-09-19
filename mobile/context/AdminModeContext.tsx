import React, { createContext, useContext, useState, useCallback } from 'react';

type AdminModeContextType = {
    isAdminMode: boolean;
    toggleAdminMode: () => void;
    setAdminMode: (val: boolean) => void;
};

const AdminModeContext = createContext<AdminModeContextType>({
    isAdminMode: false,
    toggleAdminMode: () => {},
    setAdminMode: () => {},
});

export const AdminModeProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAdminMode, setIsAdminMode] = useState(false);

    const toggleAdminMode = useCallback(() => setIsAdminMode(prev => !prev), []);
    const setAdminMode = useCallback((val: boolean) => setIsAdminMode(val), []);

    return (
        <AdminModeContext.Provider value={{ isAdminMode, toggleAdminMode, setAdminMode }}>
            {children}
        </AdminModeContext.Provider>
    );
};

export const useAdminMode = () => useContext(AdminModeContext);
