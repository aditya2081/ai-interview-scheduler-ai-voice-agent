import { useEffect, useState, useCallback } from 'react';

export function useAutoPhotoSync(interviewId, candidateEmail, triggerSync = false) {
    const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'
    const [syncMessage, setSyncMessage] = useState('');
    const [lastSyncTime, setLastSyncTime] = useState(null);

    const performSync = useCallback(async (immediate = false) => {
        if (!interviewId || !candidateEmail) return;

        try {
            setSyncStatus('syncing');
            setSyncMessage('Checking for photos to sync...');

            console.log(`🔄 ${immediate ? 'Immediate' : 'Auto'}-syncing photos for interview ${interviewId}, email: ${candidateEmail}`);

            const response = await fetch('/api/sync-photo-urls', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    interviewId,
                    candidateEmail,
                    mode: 'auto-sync',
                    immediate: immediate
                })
            });

            const result = await response.json();

            if (result.success) {
                setSyncStatus('success');
                const syncedCount = result.summary?.successfulRollbacks || 0;
                setSyncMessage(`✅ Sync completed: ${syncedCount} photos synced`);
                setLastSyncTime(new Date().toISOString());
                console.log('✅ Photo sync successful:', result);
                
                // Hide success message after 3 seconds
                setTimeout(() => {
                    setSyncStatus('idle');
                    setSyncMessage('');
                }, 3000);
            } else {
                setSyncStatus('error');
                setSyncMessage(`❌ Sync failed: ${result.error}`);
                console.error('❌ Photo sync failed:', result.error);
                
                // Hide error message after 5 seconds
                setTimeout(() => {
                    setSyncStatus('idle');
                    setSyncMessage('');
                }, 5000);
            }
        } catch (error) {
            setSyncStatus('error');
            setSyncMessage(`❌ Sync error: ${error.message}`);
            console.error('❌ Photo sync error:', error);
            
            // Hide error message after 5 seconds
            setTimeout(() => {
                setSyncStatus('idle');
                setSyncMessage('');
            }, 5000);
        }
    }, [interviewId, candidateEmail]);

    // Auto-sync on mount
    useEffect(() => {
        performSync(false);
    }, [performSync]);

    // Trigger immediate sync when requested
    useEffect(() => {
        if (triggerSync) {
            performSync(true);
        }
    }, [triggerSync, performSync]);

    return {
        syncStatus,
        syncMessage,
        isSuccess: syncStatus === 'success',
        isError: syncStatus === 'error',
        isSyncing: syncStatus === 'syncing',
        lastSyncTime,
        triggerImmediateSync: () => performSync(true)
    };
}