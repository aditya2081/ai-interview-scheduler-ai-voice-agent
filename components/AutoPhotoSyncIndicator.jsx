"use client"
import React from 'react';
import { useAutoPhotoSync } from '@/hooks/useAutoPhotoSync';

export default function AutoPhotoSyncIndicator({ interviewId, candidateEmail }) {
    const { syncStatus, syncMessage, isSuccess, isError, isSyncing } = useAutoPhotoSync(interviewId, candidateEmail);

    // Don't show anything if idle or successful
    if (syncStatus === 'idle' || isSuccess) return null;

    return (
        <div className={`fixed top-4 right-4 max-w-sm p-3 rounded-lg shadow-lg z-50 ${
            isSuccess ? 'bg-green-100 border border-green-300 text-green-800' :
            isError ? 'bg-red-100 border border-red-300 text-red-800' :
            'bg-blue-100 border border-blue-300 text-blue-800'
        }`}>
            <div className="flex items-center gap-2">
                {isSyncing && (
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                )}
                {isSuccess && (
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                )}
                {isError && (
                    <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                )}
                <div className="text-sm font-medium">
                    {isSyncing ? 'Syncing Photos...' : isSuccess ? 'Photos Synced' : 'Sync Failed'}
                </div>
            </div>
            <div className="text-xs mt-1 opacity-80">
                {syncMessage}
            </div>
        </div>
    );
}