import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/Colors';
import { ShieldCheck } from 'lucide-react-native';

/**
 * AuthCallback Screen
 * Handles the redirection from Supabase/Discord OAuth flow.
 * Consumes the tokens from the URL and redirects to the main app.
 */
export default function AuthCallback() {
  const router = useRouter();
  const pulseAnim = React.useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Pulsing animation for the loader
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    const processAuth = async () => {
      // Small delay to let Supabase client process the URL hash automatically
      // since detectSessionInUrl is set to true in lib/supabase.ts
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && !error) {
          // Connection success
          console.log("Cloud link established. Welcome agent.");
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 1500);
        } else {
          // If no session is found after 2 seconds, fallback to login
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              router.replace('/(tabs)');
            } else {
              router.replace('/auth/login');
            }
          }, 2000);
        }
      } catch (err) {
        console.error("Auth callback system failure:", err);
        router.replace('/auth/login');
      }
    };

    processAuth();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, { opacity: pulseAnim }]}>
        <ShieldCheck size={64} color={Colors.primary} strokeWidth={2} />
      </Animated.View>
      
      <Text style={styles.title}>IDENTIFICATION</Text>
      <Text style={styles.subtitle}>ÉTABLISSEMENT DU LIEN SÉCURISÉ...</Text>
      
      <View style={styles.loaderContainer}>
        <View style={styles.loaderBar}>
          <Animated.View style={[styles.loaderProgress, { opacity: pulseAnim }]} />
        </View>
        <Text style={styles.loaderText}>SYNC_STATUS: IN_PROGRESS</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>MONSTER TECHNIST • SECURE CALLBACK</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  iconContainer: {
    marginBottom: 40,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
    marginBottom: 12,
  },
  subtitle: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 60,
  },
  loaderContainer: {
    width: '100%',
    alignItems: 'center',
  },
  loaderBar: {
    width: 200,
    height: 2,
    backgroundColor: Colors.card,
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  loaderProgress: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
  },
  loaderText: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 8,
    letterSpacing: 3,
    fontWeight: '600',
    opacity: 0.5,
  },
});
