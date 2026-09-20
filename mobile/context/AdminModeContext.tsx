import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

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
    const { user } = useAuth();

    // Security: Automatically reset admin mode to false whenever user logs out or switches accounts
    useEffect(() => {
        setIsAdminMode(false);
    }, [user?.uid]);

    const toggleAdminMode = useCallback(() => setIsAdminMode(prev => !prev), []);
    const setAdminMode = useCallback((val: boolean) => setIsAdminMode(val), []);

    return (
        <AdminModeContext.Provider value={{ isAdminMode, toggleAdminMode, setAdminMode }}>
            {children}
        </AdminModeContext.Provider>
    );
};

export const useAdminMode = () => useContext(AdminModeContext);
