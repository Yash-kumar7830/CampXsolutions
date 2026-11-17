import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
const AuthContext = createContext(undefined);
const DEMO_USER_KEY = 'campusxfind-demo-user';
const PASSWORD_SETUP_PENDING_KEY = 'campusxfind-password-setup-pending';
const toDemoUser = (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@kiet\.edu$/.test(normalizedEmail))
        return null;
    return {
        id: `demo-${normalizedEmail}`,
        email: normalizedEmail,
        username: normalizedEmail.split('@')[0],
    };
};
const toUser = (session) => {
    const user = session?.user;
    if (!user?.email)
        return null;
    return {
        id: user.id,
        email: user.email,
        username: user.user_metadata.full_name || user.email.split('@')[0],
        isAdmin: user.app_metadata?.role === 'admin',
    };
};
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(() => window.localStorage.getItem(PASSWORD_SETUP_PENDING_KEY) === 'true');
    useEffect(() => {
        if (!supabase) {
            window.localStorage.removeItem(PASSWORD_SETUP_PENDING_KEY);
            setRequiresPasswordSetup(false);
            const savedEmail = window.localStorage.getItem(DEMO_USER_KEY);
            const demoUser = savedEmail ? toDemoUser(savedEmail) : null;
            if (savedEmail && !demoUser)
                window.localStorage.removeItem(DEMO_USER_KEY);
            setCurrentUser(demoUser);
            setIsLoading(false);
            return;
        }
        void supabase.auth.getSession().then(({ data, error }) => {
            if (error)
                console.error('Unable to restore the Supabase session:', error.message);
            setCurrentUser(toUser(data.session));
            setIsLoading(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUser(toUser(session));
            setIsLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);
    const value = useMemo(() => ({
        currentUser,
        isLoading,
        requiresPasswordSetup,
        demoMode: !supabase,
        signInDemo: (email) => {
            if (supabase)
                throw new Error('Demo sign-in is disabled while the Supabase backend is connected.');
            const user = toDemoUser(email);
            if (!user)
                throw new Error('Use a KIET email address ending in @kiet.edu.');
            window.localStorage.setItem(DEMO_USER_KEY, user.email);
            setCurrentUser(user);
        },
        sendSignupOtp: async ({ email, profile }) => {
            const normalizedEmail = email.trim().toLowerCase();
            if (!/^[^\s@]+@kiet\.edu$/.test(normalizedEmail)) {
                throw new Error('Use your KIET email address ending in @kiet.edu.');
            }
            if (!supabase) {
                throw new Error('campXsolutions is not connected to Supabase. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.');
            }
            const { error } = await supabase.auth.signInWithOtp({
                email: normalizedEmail,
                options: {
                    shouldCreateUser: true,
                    data: {
                        full_name: profile.fullName.trim(),
                        branch: profile.branch.trim(),
                        course: profile.course.trim(),
                        year_of_study: Number(profile.yearOfStudy),
                    },
                },
            });
            if (error)
                throw new Error(error.message);
        },
        verifyEmailOtp: async (email, token) => {
            if (!supabase)
                throw new Error('campXsolutions is not connected to Supabase.');
            const { error } = await supabase.auth.verifyOtp({
                email: email.trim().toLowerCase(),
                token: token.trim(),
                type: 'email',
            });
            if (error)
                throw new Error(error.message);
            window.localStorage.setItem(PASSWORD_SETUP_PENDING_KEY, 'true');
            setRequiresPasswordSetup(true);
        },
        sendPasswordResetOtp: async (email) => {
            const normalizedEmail = email.trim().toLowerCase();
            if (!/^[^\s@]+@kiet\.edu$/.test(normalizedEmail)) {
                throw new Error('Use your KIET email address ending in @kiet.edu.');
            }
            if (!supabase)
                throw new Error('campXsolutions is not connected to Supabase.');
            const { error } = await supabase.auth.signInWithOtp({
                email: normalizedEmail,
                options: { shouldCreateUser: false },
            });
            if (error)
                throw new Error(error.message);
        },
        updatePassword: async (password) => {
            if (!supabase)
                throw new Error('campXsolutions is not connected to Supabase.');
            const { error } = await supabase.auth.updateUser({ password });
            if (error)
                throw new Error(error.message);
            window.localStorage.removeItem(PASSWORD_SETUP_PENDING_KEY);
            setRequiresPasswordSetup(false);
        },
        signIn: async (email, password) => {
            if (!supabase)
                throw new Error('campXsolutions is not connected to Supabase.');
            const normalizedEmail = email.trim().toLowerCase();
            if (!/^[^\s@]+@kiet\.edu$/.test(normalizedEmail)) {
                throw new Error('Use your KIET email address ending in @kiet.edu.');
            }
            const { error } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password,
            });
            if (error)
                throw new Error(error.message);
            window.localStorage.removeItem(PASSWORD_SETUP_PENDING_KEY);
            setRequiresPasswordSetup(false);
        },
        logout: async () => {
            if (!supabase) {
                window.localStorage.removeItem(DEMO_USER_KEY);
                setCurrentUser(null);
                return;
            }
            const { error } = await supabase.auth.signOut();
            if (error)
                throw new Error(error.message);
        },
    }), [currentUser, isLoading, requiresPasswordSetup]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context)
        throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
