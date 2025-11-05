import React from 'react';
import DashboardProvider from './provider';
import AuthGuard from '@/components/AuthGuard';

function DashboardLayout({ children }) {
    return (
        <AuthGuard>
            <div className='bg-secondary'>
                <DashboardProvider>
                    <div className='p-10'>
                        {children}
                    </div>
                </DashboardProvider>
            </div>
        </AuthGuard>
    )
}

export default DashboardLayout
