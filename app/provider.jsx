"use client"
import { UserDetailContext } from '../context/UserDetailContext';
import { supabase } from '../services/supabaseClient';
import React, { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';

function Provider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const router = useRouter();

    useEffect(() => {
        // Get initial session
        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change:', event, session?.user?.email);
            setSession(session);
            
            if (event === 'SIGNED_IN' && session) {
                await handleUserSession(session.user);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setSession(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const getSession = async () => {
        try {
            setLoading(true);
            
            // Increase timeout to 5 seconds for session check
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Session check timeout - continuing without auth')), 5000)
            );
            
            const sessionPromise = supabase.auth.getSession();
            
            try {
                const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
                
                if (error) {
                    console.warn('Session error (non-critical):', error);
                    setSession(null);
                    setUser(null);
                    return;
                }

                setSession(session);
                
                if (session?.user) {
                    // Don't wait for user creation/fetching - do it in background
                    handleUserSession(session.user).catch(err => 
                        console.warn('User session handling failed (non-critical):', err)
                    );
                    
                    // Set a basic user immediately to speed up loading
                    setUser({
                        email: session.user.email,
                        name: session.user.user_metadata?.name || 'User',
                        picture: session.user.user_metadata?.picture
                    });
                } else {
                    setUser(null);
                }
            } catch (sessionTimeoutError) {
                console.warn('Session timeout (non-critical):', sessionTimeoutError);
                // App continues to work without authentication
                setSession(null);
                setUser(null);
            }
        } catch (error) {
            console.warn('Session check failed (non-critical):', error);
            setSession(null);
            setUser(null);
        } finally {
            setLoading(false); // Always set loading to false quickly
        }
    };

    const handleUserSession = async (authUser) => {
        try {
            // Increase timeout to 5 seconds and make database operations optional
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database query timeout - continuing with basic user info')), 5000)
            );

            // Check if user exists in database with timeout
            const queryPromise = supabase
                .from('Users')
                .select("*")
                .eq('email', authUser.email)
                .limit(1); // Limit to 1 for faster query

            try {
                const { data: users, error: selectError } = await Promise.race([queryPromise, timeoutPromise]);

                if (selectError) {
                    console.warn('Database select error (non-critical):', selectError);
                    // Keep the basic user info that was already set
                    return;
                }

                if (users?.length === 0) {
                    // Try to create user in background, don't block UI
                    const insertPromise = supabase.from("Users")
                        .insert([
                            {
                                name: authUser.user_metadata?.name,
                                email: authUser.email, 
                                picture: authUser.user_metadata?.picture
                            }
                        ])
                        .select();
                    
                    try {
                        const { data, error: insertError } = await Promise.race([insertPromise, timeoutPromise]);
                            
                        if (!insertError && data) {
                            setUser(data[0]);
                        }
                        // If insert fails, keep the basic user info
                    } catch (insertTimeoutError) {
                        console.warn('User creation timeout (non-critical):', insertTimeoutError);
                        // Keep the basic user info that was already set
                    }
                } else {
                    // Update user with database info
                    setUser(users[0]);
                }
            } catch (queryTimeoutError) {
                console.warn('Database query timeout (non-critical):', queryTimeoutError);
                // App continues to work with basic user info
                return;
            }

        } catch (error) {
            console.warn('User session handling failed (non-critical):', error);
            // App continues with basic user info - no errors thrown
        }
    };

    // Show improved loading while checking authentication
    if (loading) {
        return <LoadingSpinner message="Initializing your session..." fullScreen={true} />;
    }

    return (
        <UserDetailContext.Provider value={{ 
            user, 
            setUser, 
            session, 
            loading,
            isAuthenticated: !!session
        }}>
            <div>{children}</div>
        </UserDetailContext.Provider>
    );
}

export default Provider;

export const useUser = () => {
    const context = useContext(UserDetailContext);
    if (!context) {
        throw new Error('useUser must be used within a Provider');
    }
    return context;
}
