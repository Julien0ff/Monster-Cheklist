import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Zap, Shield, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

// Discord brand color
const DISCORD_COLOR = '#5865F2';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const { signInWithDiscord, continueAsGuest } = useAuth();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoGlowAnim = useRef(new Animated.Value(0.3)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;
  const buttonsSlide = useRef(new Animated.Value(30)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(buttonsFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(buttonsSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    // Logo glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(logoGlowAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Scan line
    Animated.loop(
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleDiscordLogin = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signInWithDiscord();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    continueAsGuest();
  };

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  return (
    <View style={styles.container}>
      {/* Background decorative elements */}
      <View style={styles.bgDecoTop} />
      <View style={styles.bgDecoBottom} />
      <View style={styles.bgDecoMid} />

      {/* Logo & Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.logoContainer}>
          <Animated.View style={[styles.logoGlow, { opacity: logoGlowAnim }]} />
          <View style={styles.logoInner}>
            <Text style={styles.logoText}>M</Text>
            <Animated.View
              style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]}
            />
          </View>
        </View>

        <Text style={styles.title}>MONSTER{'\n'}CHEKLIST</Text>
        <View style={styles.subtitleRow}>
          <Shield size={12} stroke={Colors.primary} strokeWidth={2} />
          <Text style={styles.subtitle}>SYSTÈME D'ARCHIVAGE ÉNERGÉTIQUE</Text>
        </View>
      </Animated.View>

      {/* Buttons */}
      <Animated.View style={[styles.buttons, { opacity: buttonsFade, transform: [{ translateY: buttonsSlide }] }]}>
        {/* Discord Login Button */}
        <TouchableOpacity
          style={styles.discordButton}
          onPress={handleDiscordLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <DiscordIcon />
              <Text style={styles.discordButtonText}>CONTINUER AVEC DISCORD</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Guest Mode */}
        <TouchableOpacity
          style={styles.guestButton}
          onPress={handleGuest}
          activeOpacity={0.85}
        >
          <Zap size={18} stroke={Colors.primary} strokeWidth={2} />
          <Text style={styles.guestButtonText}>MODE INVITÉ</Text>
        </TouchableOpacity>

        <Text style={styles.guestHint}>
          Le mode invité sauvegarde localement.{'\n'}Connecte-toi pour synchroniser tes données.
        </Text>
      </Animated.View>

      {/* Footer */}
      <Text style={styles.footer}>v1.0 • MONSTER CHEKLIST • SYSTÈME CRYPTÉ</Text>
    </View>
  );
}

function DiscordIcon() {
  return (
    <View style={styles.discordIconWrap}>
      <Users size={20} stroke="#fff" strokeWidth={2.5} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  bgDecoTop: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: DISCORD_COLOR,
    opacity: 0.03,
  },
  bgDecoBottom: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary,
    opacity: 0.02,
  },
  bgDecoMid: {
    position: 'absolute',
    top: '40%',
    left: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: DISCORD_COLOR,
    opacity: 0.015,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 52,
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 45,
    backgroundColor: Colors.primary,
    opacity: 0.15,
  },
  logoInner: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  logoText: {
    color: Colors.primary,
    fontSize: 56,
    fontWeight: '900',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.4,
  },
  title: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  subtitle: {
    color: Colors.primary,
    fontSize: 9,
    letterSpacing: 3,
    fontWeight: '700',
    opacity: 0.8,
  },

  // Buttons
  buttons: {
    width: '100%',
    gap: 14,
  },

  // Discord
  discordButton: {
    backgroundColor: DISCORD_COLOR,
    height: 58,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: DISCORD_COLOR,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  discordButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  discordIconWrap: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: 16,
  },

  // Guest
  guestButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  guestButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  guestHint: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 36,
    color: Colors.textMuted,
    fontSize: 9,
    letterSpacing: 3,
    fontWeight: '600',
  },
});
