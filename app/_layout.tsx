import * as React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, Animated, Text, StyleSheet, Alert, Linking } from 'react-native';
import { Colors } from '../constants/Colors';

function SplashLoader() {
  const pulseAnim = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={splashStyles.container}>
      <Animated.View style={[splashStyles.logoContainer, { opacity: pulseAnim }]}>  
        <Text style={splashStyles.logo}>M</Text>
      </Animated.View>
      <Text style={splashStyles.title}>MONSTER TECHNIST</Text>
      <Animated.View style={{ opacity: pulseAnim }}>
        <Text style={splashStyles.subtitle}>INITIALISATION DU SYSTÈME...</Text>
      </Animated.View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 4,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 6,
    opacity: 0.7,
  },
});

function RootLayoutNav() {
  const { session, isLoading, isGuest } = useAuth();

  React.useEffect(() => {
    const checkUpdate = async () => {
      // On évite de checker en mode développement
      if (__DEV__) return;
      
      try {
        const repo = "Julien0ff/Monster-Cheklist";
        const currentVersion = "1.0.0"; // Doit correspondre à package.json
        
        const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
        const data = await response.json();
        
        if (data && data.tag_name && data.tag_name !== currentVersion) {
          Alert.alert(
            "💾 MISE À JOUR DISPONIBLE",
            `L'unité Technist a été améliorée (${data.tag_name}). Voulez-vous déployer la mise à jour ?`,
            [
              { text: "PLUS TARD", style: "cancel" },
              { 
                text: "TÉLÉCHARGER", 
                onPress: () => Linking.openURL('https://julien0ff.github.io/Monster-Cheklist/') 
              }
            ]
          );
        }
      } catch (e) {
        // Échec silencieux de la vérification
      }
    };

    checkUpdate();
  }, []);

  if (isLoading) {
    return <SplashLoader />;
  }

  const isAuthenticated = !!session || isGuest;

  // Flat stack — no nested navigators to avoid Fabric recursion in React 19.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="auth/login" options={{ animation: 'fade' }} />
          <Stack.Screen name="auth/signup" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="auth/callback" options={{ animation: 'fade' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="details/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootLayoutNav />
    </AuthProvider>
  );
}
