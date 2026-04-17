import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useMonsterStore, Monster } from '../../hooks/useMonsterStore';
import { Scan, Search, Trash2, Zap, X, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScannerModal } from '../../components/ScannerModal';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { CATEGORY_COLORS, MonsterCategory } from '../../constants/monsterDatabase';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

export default function CatalogueScreen() {
  const { collection, removeMonster, addMonster, loading, syncWithCloud } = useMonsterStore();
  const { user, isGuest, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const router = useRouter();

  // Animation for header
  const headerFade = useRef(new Animated.Value(0)).current;
  const counterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (user && !loading) {
      syncWithCloud();
    }
  }, [user]);

  const filteredCollection = collection.filter(monster => {
    const matchesSearch =
      monster.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      monster.barcode.includes(searchQuery);
    const matchesCategory = !selectedCategory || monster.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(collection.map(m => m.category).filter(Boolean))] as string[];

  const handleDelete = (item: Monster) => {
    Alert.alert(
      'Supprimer',
      `Retirer "${item.name}" de ta collection ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            removeMonster(item.id);
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Veux-tu te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  const renderItem = ({ item, index }: { item: Monster; index: number }) => {
    const catColor = item.color || Colors.primary;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/details/${item.id}`)}
        activeOpacity={0.8}
      >
        {/* Top colored accent bar */}
        <View style={[styles.cardAccent, { backgroundColor: catColor }]} />

        <View style={styles.imageContainer}>
          <View style={[styles.imageGlow, { backgroundColor: catColor, opacity: 0.06 }]} />
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            resizeMode="contain"
            defaultSource={require('../../assets/clean-icon.png')}
          />
          <View style={styles.badgeCaffeine}>
            <Zap size={9} stroke={Colors.primary} strokeWidth={3} />
            <Text style={styles.badgeText}>{item.caffeine}mg</Text>
          </View>
          {item.category && (
            <View style={[styles.badgeCategory, { backgroundColor: catColor + '22', borderColor: catColor + '44' }]}>
              <Text style={[styles.badgeCategoryText, { color: catColor }]}>{item.category.toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.monsterName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.monsterDate}>{item.dateAdded}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={14} stroke={Colors.danger} strokeWidth={1.5} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Title bar */}
      <Animated.View style={[styles.titleBar, { opacity: headerFade }]}>
        <View>
          <Text style={styles.appTitle}>MONSTER TECHNIST</Text>
          <Text style={styles.collectionCount}>
            {collection.length} ARCHIVE{collection.length !== 1 ? 'S' : ''} • {isGuest ? 'MODE INVITÉ' : user?.user_metadata?.full_name}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleSignOut}>
          <LogOut size={18} stroke={Colors.textSecondary} strokeWidth={1.5} />
        </TouchableOpacity>
      </Animated.View>

      {/* Search + Scan */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={18} stroke={Colors.textSecondary} strokeWidth={1.5} />
          <TextInput
            style={styles.input}
            placeholder="Rechercher une Monster..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} stroke={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsScannerVisible(true);
          }}
        >
          <Scan size={22} stroke={Colors.background} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <View style={styles.chipContainer}>
          <TouchableOpacity
            style={[styles.chip, !selectedCategory && styles.chipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>TOUT</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                selectedCategory === cat && {
                  ...styles.chipActive,
                  borderColor: CATEGORY_COLORS[cat as MonsterCategory]?.primary || Colors.primary,
                  backgroundColor: (CATEGORY_COLORS[cat as MonsterCategory]?.primary || Colors.primary) + '15',
                },
              ]}
              onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedCategory === cat && {
                    color: CATEGORY_COLORS[cat as MonsterCategory]?.primary || Colors.primary,
                  },
                ]}
              >
                {cat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filteredCollection}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Zap size={40} stroke={Colors.textMuted} strokeWidth={1} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'AUCUNE ARCHIVE TROUVÉE' : 'BASE DE DONNÉES VIDE'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Essaie une autre recherche'
                : 'Scanne ta première canette Monster pour commencer'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsScannerVisible(true)}
              >
                <Scan size={20} stroke={Colors.background} strokeWidth={2.5} />
                <Text style={styles.addButtonText}>SCANNER UNE CANETTE</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <ScannerModal
        isVisible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onScanComplete={(monster: Monster) => {
          addMonster(monster);
          setIsScannerVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 8,
  },
  appTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
  },
  collectionCount: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
    opacity: 0.7,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  scanButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },

  // Category chips
  chipContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  chipTextActive: {
    color: Colors.primary,
  },

  // List
  listContent: {
    padding: 12,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },

  // Card
  card: {
    width: COLUMN_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardAccent: {
    height: 3,
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    position: 'relative',
  },
  imageGlow: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: 40,
  },
  image: {
    width: '85%',
    height: '85%',
  },
  badgeCaffeine: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(2, 4, 8, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  badgeCategory: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeCategoryText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
  },
  monsterName: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  monsterDate: {
    color: Colors.textSecondary,
    fontSize: 9,
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  deleteButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.dangerMuted,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  addButtonText: {
    color: Colors.background,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
  },
});
