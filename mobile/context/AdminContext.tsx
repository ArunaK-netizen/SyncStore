import React, { createContext, useContext } from 'react';
import { useAdminData } from '../hooks/useAdminData';

type AdminContextType = ReturnType<typeof useAdminData>;

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
    const adminData = useAdminData();
    return <AdminContext.Provider value={adminData}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) throw new Error('useAdmin must be used within AdminProvider');
    return context;
};
