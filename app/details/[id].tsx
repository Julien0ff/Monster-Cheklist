import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  Animated,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useMonsterStore, Monster } from '../../hooks/useMonsterStore';
import { Zap, Calendar, Barcode, ChevronLeft, Share2, Sparkles, Tag, Beaker } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { CATEGORY_COLORS, MonsterCategory } from '../../constants/monsterDatabase';

const { width } = Dimensions.get('window');

export default function MonsterDetails() {
  const { id } = useLocalSearchParams();
  const { collection } = useMonsterStore();
  const router = useRouter();
  const [aiLore, setAiLore] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  const monster = collection.find(m => m.id === id);

  // Animations
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.9)).current;
  const infoSlide = useRef(new Animated.Value(50)).current;
  const infoFade = useRef(new Animated.Value(0)).current;
  const aiCardFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(heroScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(infoFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(infoSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(aiCardFade, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (monster) {
      generateAiLore();
    }
  }, [monster]);

  const generateAiLore = async () => {
    if (!monster) return;
    setLoadingAi(true);
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY || ''}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'Tu es "TECHNODE", une IA spécialisée dans l\'analyse des boissons énergétiques Monster Energy. Style cyberpunk, techno-analyste. Réponds en 3-4 phrases maximum. Inclus une note de goût sur 10 à la fin.'
            },
            {
              role: 'user',
              content: `Analyse cette unité : "${monster.name || 'Monster Unknown'}" (${monster.caffeine || 160}mg caféine, catégorie: ${monster.category || 'Original'})`
            }
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Groq API error:', response.status, errorBody);
        setAiLore(`Erreur API Groq (${response.status}). TECHNODE temporairement hors ligne.`);
        setLoadingAi(false);
        return;
      }
      
      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        setAiLore(data.choices[0].message.content);
      } else if (data.error) {
        console.error('Groq error:', data.error);
        setAiLore(`Erreur Groq : ${data.error.message || 'Réponse invalide'}`);
      } else {
        setAiLore("Réponse TECHNODE invalide. Réessaie en appuyant sur l'icône.");
      }
    } catch (error) {
      setAiLore("Connexion au système TECHNODE interrompue. Réessaie plus tard.");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleShare = async () => {
    if (!monster) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Share.share({
      message: `🔋 ${monster.name} — ${monster.caffeine}mg de caféine !\nAjoutée à ma collection Monster Technist 🎯\n#MonsterTechnist #MonsterEnergy`,
    });
  };

  if (!monster) return null;

  const accentColor = monster.color || Colors.primary;
  const catColors = monster.category ? CATEGORY_COLORS[monster.category as MonsterCategory] : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={22} stroke={Colors.white} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Share2 size={20} stroke={Colors.white} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Hero Image */}
        <Animated.View style={[styles.heroSection, { opacity: heroFade, transform: [{ scale: heroScale }] }]}>
          <View style={[styles.heroGlow, { backgroundColor: accentColor, opacity: 0.08 }]} />
          <View style={[styles.heroGlowInner, { backgroundColor: accentColor, opacity: 0.04 }]} />
          <Image
            source={{ uri: monster.image }}
            style={styles.heroImage}
            resizeMode="contain"
            defaultSource={require('../../assets/clean-icon.png')}
          />
        </Animated.View>

        {/* Info Section */}
        <Animated.View style={[styles.infoSection, { opacity: infoFade, transform: [{ translateY: infoSlide }] }]}>
          {/* Category badge */}
          {monster.category && (
            <View style={[styles.categoryBadge, { backgroundColor: accentColor + '18', borderColor: accentColor + '40' }]}>
              <Tag size={11} stroke={accentColor} strokeWidth={2} />
              <Text style={[styles.categoryText, { color: accentColor }]}>{monster.category.toUpperCase()}</Text>
            </View>
          )}

          <Text style={styles.monsterName}>{monster.name}</Text>

          <View style={styles.barcodeRow}>
            <Barcode size={12} stroke={Colors.textSecondary} strokeWidth={1.5} />
            <Text style={styles.barcode}>{monster.barcode}</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderColor: accentColor + '30' }]}>
              <Zap size={18} stroke={accentColor} strokeWidth={2} />
              <Text style={styles.statValue}>{monster.caffeine}mg</Text>
              <Text style={styles.statLabel}>CAFÉINE</Text>
            </View>
            <View style={[styles.statCard, { borderColor: accentColor + '30' }]}>
              <Calendar size={18} stroke={accentColor} strokeWidth={2} />
              <Text style={styles.statValue}>{monster.dateAdded}</Text>
              <Text style={styles.statLabel}>ARCHIVÉ LE</Text>
            </View>
            <View style={[styles.statCard, { borderColor: accentColor + '30' }]}>
              <Beaker size={18} stroke={accentColor} strokeWidth={2} />
              <Text style={styles.statValue}>VÉRIFIÉ</Text>
              <Text style={styles.statLabel}>ORIGINAL</Text>
            </View>
          </View>

          {/* AI Analysis Card */}
          <Animated.View style={[styles.aiCard, { opacity: aiCardFade, borderColor: accentColor + '40' }]}>
            <View style={[styles.aiHeader, { borderBottomColor: accentColor + '15', backgroundColor: accentColor + '06' }]}>
              <View style={styles.aiTitleContainer}>
                <Sparkles size={16} stroke={accentColor} strokeWidth={2} />
                <Text style={[styles.aiTitle, { color: accentColor }]}>ANALYSE TECHNODE</Text>
              </View>
              {loadingAi && <ActivityIndicator size="small" color={accentColor} />}
            </View>

            <View style={styles.aiBody}>
              {loadingAi ? (
                <View style={styles.aiLoader}>
                  <View style={styles.aiLoaderDots}>
                    <View style={[styles.dot, { backgroundColor: accentColor }]} />
                    <View style={[styles.dot, { backgroundColor: accentColor, opacity: 0.6 }]} />
                    <View style={[styles.dot, { backgroundColor: accentColor, opacity: 0.3 }]} />
                  </View>
                  <Text style={[styles.loadingText, { color: accentColor }]}>DÉCRYPTAGE DES DONNÉES...</Text>
                </View>
              ) : (
                <Text style={styles.aiLoreText}>{aiLore}</Text>
              )}
            </View>

            <View style={styles.aiFooter}>
              <Text style={styles.footerText}>MODÈLE: LLAMA3 • SYSTÈME: TECHNODE v2.1</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(10, 15, 26, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(10, 15, 26, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Hero
  heroSection: {
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -60,
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  heroGlowInner: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
  },
  heroImage: {
    width: width * 0.75,
    height: '100%',
  },

  // Info
  infoSection: {
    padding: 24,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  monsterName: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
    lineHeight: 34,
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  barcode: {
    color: Colors.textSecondary,
    fontSize: 13,
    letterSpacing: 3,
    fontWeight: '600',
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    marginTop: 28,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 8,
    marginTop: 4,
    letterSpacing: 1,
    fontWeight: '700',
  },

  // AI Card
  aiCard: {
    marginTop: 28,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  aiTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  aiBody: {
    padding: 18,
    minHeight: 100,
  },
  aiLoreText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  aiLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  aiLoaderDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingText: {
    fontSize: 9,
    letterSpacing: 4,
    fontWeight: '800',
  },
  aiFooter: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 8,
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '700',
  },
});
