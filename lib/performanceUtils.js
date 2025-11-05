// Performance optimization utilities
export const withTimeout = (promise, timeout = 5000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), timeout)
        )
    ]);
};

// Simple in-memory cache for frequently accessed data
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedData = (key) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
};

export const setCachedData = (key, data) => {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
};

// Optimize Supabase queries
export const optimizedQuery = async (queryBuilder, cacheKey = null) => {
    // Check cache first
    if (cacheKey) {
        const cached = getCachedData(cacheKey);
        if (cached) {
            console.log('🚀 Cache hit for:', cacheKey);
            return { data: cached, error: null };
        }
    }

    try {
        const result = await withTimeout(queryBuilder);
        
        // Cache successful results
        if (cacheKey && result.data && !result.error) {
            setCachedData(cacheKey, result.data);
        }
        
        return result;
    } catch (error) {
        console.error('Query failed:', error);
        return { data: null, error };
    }
};