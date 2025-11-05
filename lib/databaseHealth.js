// Database connection health check utility
import { supabase } from '@/services/supabaseClient';

let dbHealthStatus = 'unknown'; // unknown, healthy, unhealthy
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

export const checkDatabaseHealth = async () => {
    const now = Date.now();
    
    // Skip health check if recently checked
    if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL && dbHealthStatus !== 'unknown') {
        return dbHealthStatus === 'healthy';
    }
    
    try {
        // Simple health check - just check if we can query
        const { error } = await supabase
            .from('Users')
            .select('count', { count: 'exact', head: true })
            .limit(0);
            
        dbHealthStatus = error ? 'unhealthy' : 'healthy';
        lastHealthCheck = now;
        
        console.log('Database health:', dbHealthStatus);
        return dbHealthStatus === 'healthy';
    } catch (error) {
        console.warn('Database health check failed:', error);
        dbHealthStatus = 'unhealthy';
        lastHealthCheck = now;
        return false;
    }
};

export const getDatabaseHealthStatus = () => dbHealthStatus;