import * as React from 'react';
import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, Animated, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Trash2 } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useMonsterStore } from '../../hooks/useMonsterStore';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Zap, Flame, Award, BarChart3, Target, TrendingUp, Coffee } from 'lucide-react-native';
import { CATEGORY_COLORS, MonsterCategory } from '../../constants/monsterDatabase';

const { width } = Dimensions.get('window');

function AnimatedProgressBar({ progress, color, delay = 0 }: { progress: number; color: string; delay?: number }) {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: Math.min(progress, 1),
      duration: 1000,
      delay,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={barStyles.container}>
      <Animated.View
        style={[
          barStyles.fill,
          {
            backgroundColor: color,
            width: animWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const animValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    animValue.setValue(0);
    Animated.timing(animValue, {
      toValue: value,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    const listener = animValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => animValue.removeListener(listener);
  }, [value]);

  return <Text style={statStyles.animValue}>{displayValue}{suffix}</Text>;
}

const statStyles = StyleSheet.create({
  animValue: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
});

export default function StatsScreen() {
  const { collection, getTopMonsters, getTotalByCategory, getTotalCaffeine, clearCollection } = useMonsterStore();
  const { user, isGuest } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const totalCaffeine = getTotalCaffeine();
  const totalItems = collection.length;
  const uniqueItems = new Set(collection.map(m => m.name)).size;
  const level = Math.floor(totalItems / 5) + 1;
  const levelProgress = (totalItems % 5) / 5;
  const topMonsters = getTopMonsters();
  const categoryBreakdown = getTotalByCategory();
  const completionPct = Math.min(100, (totalItems / 50) * 100);

  const stats = [
    {
      label: 'Caféine Totale',
      value: totalCaffeine,
      suffix: 'mg',
      icon: <Zap size={20} stroke={Colors.primary} strokeWidth={2} />,
      desc: 'Énergie cumulée',
    },
    {
      label: 'Collection',
      value: totalItems,
      suffix: '',
      icon: <Trophy size={20} stroke={Colors.accentGold} strokeWidth={2} />,
      desc: 'Canettes scannées',
    },
    {
      label: 'Éditions Uniques',
      value: uniqueItems,
      suffix: '',
      icon: <Award size={20} stroke={Colors.accentPurple} strokeWidth={2} />,
      desc: 'Variétés trouvées',
    },
    {
      label: 'Niveau Technist',
      value: level,
      suffix: '',
      icon: <TrendingUp size={20} stroke={Colors.accentBlue} strokeWidth={2} />,
      desc: `${(levelProgress * 100).toFixed(0)}% → niv. ${level + 1}`,
      progress: levelProgress,
      progressColor: Colors.accentBlue,
    },
  ];

  const achievements = [
    {
      icon: Flame,
      label: 'PREMIÈRE DOSE',
      desc: 'Scanner 5 canettes',
      unlocked: totalItems >= 5,
      progress: Math.min(totalItems / 5, 1),
    },
    {
      icon: Trophy,
      label: 'COLLECTIONNEUR',
      desc: 'Scanner 20 canettes',
      unlocked: totalItems >= 20,
      progress: Math.min(totalItems / 20, 1),
    },
    {
      icon: Award,
      label: 'GOÛTEUR EXPLORATEUR',
      desc: '10 variétés uniques',
      unlocked: uniqueItems >= 10,
      progress: Math.min(uniqueItems / 10, 1),
    },
    {
      icon: Coffee,
      label: 'OVERDOSE DIGITALE',
      desc: '5000mg de caféine cumulée',
      unlocked: totalCaffeine >= 5000,
      progress: Math.min(totalCaffeine / 5000, 1),
    },
    {
      icon: Target,
      label: 'TECHNIST SUPREME',
      desc: '50 canettes archivées',
      unlocked: totalItems >= 50,
      progress: Math.min(totalItems / 50, 1),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.progressRing}>
            <Text style={styles.progressValue}>{completionPct.toFixed(0)}%</Text>
            <Text style={styles.progressLabel}>COMPLÉTION</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.userName}>
              {isGuest ? 'AGENT INVITÉ' : user?.email?.split('@')[0]?.toUpperCase() || 'AGENT TECHNIST'}
            </Text>
            <Text style={styles.userStatus}>NIVEAU {level} • SESSION ACTIVE</Text>
            <AnimatedProgressBar progress={levelProgress} color={Colors.accentBlue} />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.grid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statHeader}>
                {stat.icon}
              </View>
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              <Text style={styles.statTitle}>{stat.label}</Text>
              <Text style={styles.statDesc}>{stat.desc}</Text>
              {stat.progress !== undefined && (
                <AnimatedProgressBar progress={stat.progress} color={stat.progressColor || Colors.primary} delay={300} />
              )}
            </View>
          ))}
        </View>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={18} stroke={Colors.primary} strokeWidth={2} />
              <Text style={styles.sectionTitle}>RÉPARTITION PAR CATÉGORIE</Text>
            </View>
            <View style={styles.categoryList}>
              {categoryBreakdown.map((cat, i) => (
                <View key={cat.category} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.categoryName}>{cat.category.toUpperCase()}</Text>
                    <Text style={styles.categoryCount}>{cat.count}</Text>
                  </View>
                  <AnimatedProgressBar
                    progress={cat.count / (categoryBreakdown[0]?.count || 1)}
                    color={cat.color}
                    delay={i * 100}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top Monsters */}
        {topMonsters.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Trophy size={18} stroke={Colors.accentGold} strokeWidth={2} />
              <Text style={styles.sectionTitle}>TOP MONSTERS</Text>
            </View>
            <View style={styles.topList}>
              {topMonsters.map((tm, i) => (
                <View key={i} style={styles.topRow}>
                  <View style={styles.topRank}>
                    <Text style={[styles.topRankText, i === 0 && { color: Colors.accentGold }]}>
                      #{i + 1}
                    </Text>
                  </View>
                  <Text style={styles.topName} numberOfLines={1}>{tm.name}</Text>
                  <Text style={styles.topCount}>×{tm.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={18} stroke={Colors.accentPurple} strokeWidth={2} />
            <Text style={styles.sectionTitle}>RÉCOMPENSES</Text>
          </View>
          <View style={styles.achievementList}>
            {achievements.map((ach, i) => {
              const Icon = ach.icon;
              return (
                <View key={i} style={[styles.badge, ach.unlocked && styles.badgeUnlocked]}>
                  <View style={styles.badgeIconWrap}>
                    <Icon
                      size={18}
                      stroke={ach.unlocked ? Colors.primary : Colors.textMuted}
                      strokeWidth={ach.unlocked ? 2 : 1.5}
                    />
                  </View>
                  <View style={styles.badgeInfo}>
                    <Text style={[styles.badgeText, !ach.unlocked && styles.badgeLocked]}>
                      {ach.label}
                    </Text>
                    <Text style={styles.badgeDesc}>{ach.desc}</Text>
                    <AnimatedProgressBar
                      progress={ach.progress}
                      color={ach.unlocked ? Colors.primary : Colors.textMuted}
                      delay={i * 80}
                    />
                  </View>
                  {ach.unlocked && (
                    <Text style={styles.badgeCheck}>✓</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Reset data */}
        {totalItems > 0 && (
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              Alert.alert(
                'Réinitialiser',
                `Supprimer toute ta collection (${totalItems} canettes) ? Cette action est irréversible.`,
                [
                  { text: 'Annuler', style: 'cancel' },
                  {
                    text: 'Tout supprimer',
                    style: 'destructive',
                    onPress: () => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      clearCollection();
                    },
                  },
                ]
              );
            }}
          >
            <Trash2 size={14} stroke={Colors.danger} strokeWidth={1.5} />
            <Text style={styles.resetBtnText}>RÉINITIALISER LES DONNÉES</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 120,
  },

  // Header
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: Colors.card,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  progressValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  progressLabel: {
    color: Colors.primary,
    fontSize: 6,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  userStatus: {
    color: Colors.primary,
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 4,
    fontWeight: '700',
    opacity: 0.7,
  },

  // Stats Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statHeader: {
    marginBottom: 10,
  },
  statTitle: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 1,
  },
  statDesc: {
    color: Colors.textMuted,
    fontSize: 9,
    marginTop: 4,
    fontWeight: '600',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },

  // Category breakdown
  categoryList: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  categoryRow: {
    gap: 4,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    flex: 1,
  },
  categoryCount: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },

  // Top Monsters
  topList: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  topRank: {
    width: 28,
    alignItems: 'center',
  },
  topRankText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  topName: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  topCount: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  // Achievements
  achievementList: {
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 14,
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeUnlocked: {
    borderColor: Colors.borderGlow,
  },
  badgeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeInfo: {
    flex: 1,
  },
  badgeText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  badgeLocked: {
    color: Colors.textMuted,
  },
  badgeDesc: {
    color: Colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
    fontWeight: '600',
  },
  badgeCheck: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.dangerMuted,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 59, 0.2)',
    marginTop: 24,
  },
  resetBtnText: {
    color: Colors.danger,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
