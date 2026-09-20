import React from 'react';
import { Redirect } from 'expo-router';
import AdminProductsView from '../../components/admin/AdminProductsView';
import { useAdminAccess } from '../../hooks/useAdminAccess';
import { useAdminMode } from '../../context/AdminModeContext';

export default function AdminProductsTab() {
    const { isAdmin } = useAdminAccess();
    const { isAdminMode } = useAdminMode();

    if (!isAdmin || !isAdminMode) {
        return <Redirect href="/(tabs)/dashboard" />;
    }

    return <AdminProductsView />;
}
