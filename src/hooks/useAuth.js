import { useState, useEffect, useCallback } from 'react';
import {
  getSupabaseClient,
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig
} from '../lib/supabaseClient';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(() => getSupabaseConfig());

  // Helper to extract clean user details
  const extractUserMeta = (authUser) => {
    if (!authUser) return null;
    const meta = authUser.user_metadata || {};
    return {
      id: authUser.id,
      email: authUser.email || '',
      fullName: meta.full_name || meta.name || authUser.email?.split('@')[0] || 'User',
      avatarUrl: meta.avatar_url || meta.picture || '',
      provider: authUser.app_metadata?.provider || 'google',
      raw: authUser
    };
  };

  // Initialize or re-initialize auth listener
  useEffect(() => {
    let authSubscription = null;
    const currentConfig = getSupabaseConfig();
    setConfig(currentConfig);

    if (!currentConfig.isConfigured) {
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Get current session
    supabase.auth.getSession().then(({ data, error: sessionErr }) => {
      if (sessionErr) {
        console.warn('Supabase getSession error:', sessionErr.message);
        setError(sessionErr.message);
      } else if (data?.session) {
        setSession(data.session);
        setUser(extractUserMeta(data.session.user));
      }
      setLoading(false);
    }).catch((err) => {
      console.warn('Error fetching session:', err);
      setLoading(false);
    });

    // Listen to auth changes (login, logout, token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (newSession) {
        setSession(newSession);
        setUser(extractUserMeta(newSession.user));
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    authSubscription = sub.subscription;

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [config.url, config.anonKey]);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    setError(null);
    const supabase = getSupabaseClient();
    if (!supabase) {
      const msg = 'Supabase credentials are not configured yet. Please configure your Project URL and Anon Key.';
      setError(msg);
      throw new Error(msg);
    }

    try {
      // Direct redirect back to current URL
      const redirectUrl = window.location.origin + window.location.pathname;
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (oauthError) throw oauthError;
      return data;
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setError(null);
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    setSession(null);
    setUser(null);
  }, []);

  // Save config
  const updateConfig = useCallback((url, anonKey) => {
    try {
      saveSupabaseConfig(url, anonKey);
      const newConfig = getSupabaseConfig();
      setConfig(newConfig);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Clear config
  const removeConfig = useCallback(() => {
    clearSupabaseConfig();
    const newConfig = getSupabaseConfig();
    setConfig(newConfig);
    setUser(null);
    setSession(null);
  }, []);

  return {
    user,
    session,
    loading,
    error,
    isConfigured: config.isConfigured,
    config,
    signInWithGoogle,
    signOut,
    updateConfig,
    removeConfig
  };
}
