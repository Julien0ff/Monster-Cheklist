import * as React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

// Required for expo-web-browser to close the browser after OAuth
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isGuest: boolean;
  signInWithDiscord: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isGuest: false,
  signInWithDiscord: async () => {},
  signOut: async () => {},
  continueAsGuest: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Initial session check
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
          setUser(session.user);
        }
      } catch (err) {
        console.error('Error getting session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        syncProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle deep link callback from Discord OAuth
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url) {
        // Extract tokens from the URL fragment
        const params = extractHashParams(url);
        if (params.access_token && params.refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (data?.session) {
            setSession(data.session);
            setUser(data.session.user);
          }
        }
      }
    };

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  const syncProfile = async (user: User) => {
    try {
      const agentId = user.id.slice(0, 8).toUpperCase();
      const discordName = user.user_metadata?.full_name || user.user_metadata?.custom_claims?.global_name || user.email?.split('@')[0];
      const avatarUrl = user.user_metadata?.avatar_url;

      await supabase.from('profiles').upsert({
        id: user.id,
        username: discordName,
        avatar_url: avatarUrl,
        agent_id: agentId,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error syncing profile:', error);
    }
  };

  const extractHashParams = (url: string): Record<string, string> => {
    const params: Record<string, string> = {};
    const hashIndex = url.indexOf('#');
    if (hashIndex === -1) return params;
    
    const hash = url.substring(hashIndex + 1);
    hash.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
    return params;
  };

  const signInWithDiscord = useCallback(async () => {
    try {
      // On utilise le site web comme "Pont" pour éviter le crash d'Expo Go
      const redirectUrl = "https://julien0ff.github.io/Monster-Cheklist";

      console.log('[AUTH] Tentative de connexion via Pont Web...');
      console.log('[AUTH] Redirect URI (Pont) :', redirectUrl);

      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'discord',
          options: { redirectTo: redirectUrl }
        });
        if (error) throw error;
        return;
      }

      // Mobile
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        const params = extractHashParams(result.url);
        if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (sessionError) throw sessionError;
        }
      }
    } catch (error) {
      console.error('[AUTH] Erreur critique :', error);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsGuest(false);
    try {
      await supabase.auth.signOut();
    } catch {
      // Silently fail
    }
    setSession(null);
    setUser(null);
  }, []);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        isGuest,
        signInWithDiscord,
        signOut,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
