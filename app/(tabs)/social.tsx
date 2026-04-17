import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Share,
  Platform,
  Animated,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Users, UserPlus, Share2, Search, Zap, ShieldCheck, Trophy, LogOut, Crown, Medal, LogIn } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { useMonsterStore } from '../../hooks/useMonsterStore';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function SocialScreen() {
  const { user, isGuest, signOut, signInWithDiscord } = useAuth();
  const { collection, getTotalCaffeine } = useMonsterStore();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const isLoggedIn = !!user && !isGuest;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    if (isLoggedIn) {
      fetchFriends();
    }
  }, [isLoggedIn]);

  const fetchFriends = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch friends for the current user
      const { data, error } = await supabase
        .from('friends')
        .select(`
          friend_id,
          profiles:friend_id (
            id, username, avatar_url, agent_id, total_monsters, total_caffeine
          )
        `)
        .eq('user_id', user.id);

      if (data && !error) {
        setFriends(data.map((f: any) => f.profiles));
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAgent = async () => {
    if (!searchQuery || searchQuery.length < 4) {
      Alert.alert('Erreur', 'Entre au moins 4 caractères du Code Agent.');
      return;
    }

    setSearching(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('agent_id', `%${searchQuery.toUpperCase()}%`)
        .limit(5);

      if (data && !error) {
        // Don't show current user in search results
        setSearchResults(data.filter((p: any) => p.id !== user?.id));
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (friendProfile: any) => {
    if (!user) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: friendProfile.id
        });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Info', 'Cet agent est déjà dans ta liste.');
        } else {
          throw error;
        }
      } else {
        Alert.alert('Succès', `${friendProfile.username} a été ajouté à ta division.`);
        setSearchQuery('');
        setSearchResults([]);
        fetchFriends();
      }
    } catch (error) {
      console.error('Add friend error:', error);
      Alert.alert('Erreur', "Impossible d'ajouter cet agent.");
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', user.id)
        .eq('friend_id', friendId);

      if (!error) {
        fetchFriends();
      }
    } catch (error) {
      console.error('Remove friend error:', error);
    }
  };

  const totalMonsters = collection.length;
  const uniqueMonsters = new Set(collection.map(m => m.name)).size;
  const totalCaffeine = getTotalCaffeine();
  const level = Math.floor(totalMonsters / 5) + 1;

  const handleShareCollection = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `🔋 Ma collection Monster Technist :\n\n• ${totalMonsters} canettes collectées\n• ${uniqueMonsters} variétés uniques\n• ${totalCaffeine}mg de caféine cumulée\n• Niveau ${level}\n\n😎 Mon Code Agent : \`\`\`\n${agentId}\`\`\`\n#MonsterTechnist`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // ─── Mode Invité / Non connecté ───────────────
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.guestContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.guestIconWrap}>
            <Users size={48} stroke={Colors.textMuted} strokeWidth={1} />
          </View>
          <Text style={styles.guestTitle}>SOCIAL</Text>
          <Text style={styles.guestSubtitle}>
            Connecte-toi pour accéder à ton profil agent, partager ta collection et rejoindre une division.
          </Text>

          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              signInWithDiscord();
            }}
            activeOpacity={0.85}
          >
            <LogIn size={20} stroke={Colors.background} strokeWidth={2.5} />
            <Text style={styles.connectButtonText}>SE CONNECTER</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    );
  }

  // ─── Mode connecté ────────────────────────────
  const agentId = user.id.slice(0, 8).toUpperCase();
  const discordName = user.user_metadata?.custom_claims?.global_name || user.user_metadata?.full_name;
  const agentName = discordName?.toUpperCase() || 'AGENT';
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      data={friends}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.friendItem}>
          <View style={styles.friendAvatar}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.friendAvatarText}>{item.username?.[0]?.toUpperCase() || 'A'}</Text>
            )}
          </View>
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{item.username}</Text>
            <View style={styles.friendStatsRow}>
              <Text style={styles.friendStatText}>LVL {Math.floor((item.total_monsters || 0) / 5) + 1}</Text>
              <View style={styles.statDot} />
              <Text style={styles.friendStatText}>{item.total_monsters || 0} CANETTES</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.removeFriendBtn}
            onPress={() => {
              Alert.alert('Supprimer', `Retirer ${item.username} de ta division ?`, [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Retirer', style: 'destructive', onPress: () => handleRemoveFriend(item.id) },
              ]);
            }}
          >
            <LogOut size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}
      ListHeaderComponent={
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Agent Card */}
          <View style={styles.agentCard}>
            <View style={styles.agentAvatarWrap}>
              <View style={styles.agentAvatar}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.agentAvatarText}>{agentName[0] || 'A'}</Text>
                )}
              </View>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.agentInfo}>
              <Text style={styles.agentIdLabel}>AGENT ID: {agentId}</Text>
              <Text style={styles.agentName}>{agentName}</Text>
              <Text style={styles.agentLevel}>NIVEAU {level} • EN LIGNE</Text>
            </View>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareCollection}>
              <Share2 size={18} stroke={Colors.background} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Search Section */}
          <View style={styles.searchSection}>
            <View style={styles.searchHeader}>
              <Search size={16} color={Colors.primary} />
              <Text style={styles.searchTitle}>RECHERCHER UN AGENT</Text>
            </View>
            <View style={styles.searchInputRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Entrez un Agent ID..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="characters"
                maxLength={8}
              />
              <TouchableOpacity
                style={styles.searchBtnAction}
                onPress={handleSearchAgent}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator size="small" color={Colors.background} />
                ) : (
                  <Search size={18} color={Colors.background} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View style={styles.resultsContainer}>
                {searchResults.map((result) => (
                  <View key={result.id} style={styles.resultItem}>
                    <View style={styles.resultAvatar}>
                      {result.avatar_url ? (
                        <Image source={{ uri: result.avatar_url }} style={styles.avatarImage} />
                      ) : (
                        <Text style={styles.resultAvatarText}>{result.username?.[0] || 'A'}</Text>
                      )}
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>{result.username}</Text>
                      <Text style={styles.resultId}>{result.agent_id}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => handleAddFriend(result)}
                    >
                      <UserPlus size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.divisionHeader}>
            <Users size={18} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.divisionTitle}>MA DIVISION ({friends.length})</Text>
          </View>

          {friends.length === 0 && !loading && (
            <View style={styles.emptyDivision}>
              <Text style={styles.emptyText}>Aucun agent dans ta division.</Text>
              <Text style={styles.emptySub}>Utilise ton Code Agent pour recruter des amis.</Text>
            </View>
          )}

          {loading && (
            <ActivityIndicator style={{ marginTop: 20 }} color={Colors.primary} />
          )}
        </Animated.View>
      }
      ListFooterComponent={
        isLoggedIn ? (
          <View style={{ marginTop: 24, paddingBottom: 40 }}>
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={() => {
                Alert.alert('Déconnexion', 'Veux-tu te déconnecter ?', [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Déconnecter', style: 'destructive', onPress: signOut },
                ]);
              }}
            >
              <LogOut size={16} stroke={Colors.danger} strokeWidth={1.5} />
              <Text style={styles.signOutText}>SE DÉCONNECTER</Text>
            </TouchableOpacity>
          </View>
        ) : null
      }
    />
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

  // ─── Guest Mode ───────────────────────────────
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  guestIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guestTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 12,
  },
  guestSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  connectButtonText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },
  guestStats: {
    marginTop: 40,
    width: '100%',
    alignItems: 'center',
  },
  guestStatsTitle: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 12,
  },
  shareCollectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
    backgroundColor: Colors.primaryMuted,
  },
  shareCollectionText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ─── Agent Card ───────────────────────────────
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
    marginBottom: 16,
  },
  agentAvatarWrap: {
    position: 'relative',
  },
  agentAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGlow,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  agentAvatarText: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.card,
  },
  agentInfo: {
    flex: 1,
  },
  agentIdLabel: {
    color: Colors.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
    opacity: 0.7,
  },
  agentName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  agentLevel: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  // ─── Quick Stats ──────────────────────────────
  quickStats: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  qStat: {
    flex: 1,
    alignItems: 'center',
  },
  qStatValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  qStatLabel: {
    color: Colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },
  qStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },

  // ─── Code Card ────────────────────────────────
  codeCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
    marginBottom: 16,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  codeTitle: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  codeDisplay: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeText: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 6,
  },
  codeHint: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '600',
  },

  // ─── Big share ────────────────────────────────
  bigShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bigShareBtnText: {
    color: Colors.background,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ─── Sign out ─────────────────────────────────
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.dangerMuted,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 59, 0.2)',
  },
  signOutText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ─── Search & Division ────────────────────────
  searchSection: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchTitle: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  searchInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    color: Colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchBtnAction: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    marginTop: 16,
    gap: 10,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  resultAvatarText: {
    color: Colors.primary,
    fontWeight: '900',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  resultId: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  addBtn: {
    padding: 8,
  },
  divisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  divisionTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  emptyDivision: {
    alignItems: 'center',
    paddingVertical: 40,
    opacity: 0.6,
  },
  emptyText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderGlow,
  },
  friendAvatarText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  friendStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  friendStatText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  removeFriendBtn: {
    padding: 10,
  },
});
