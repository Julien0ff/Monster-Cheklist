import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { findMonsterByBarcode, CATEGORY_COLORS, MonsterCategory } from '../constants/monsterDatabase';

export interface Monster {
  id: string;
  name: string;
  barcode: string;
  dateAdded: string;
  image: string;
  caffeine: number;
  category?: MonsterCategory;
  color?: string;
}

interface MonsterStore {
  collection: Monster[];
  loading: boolean;
  addMonster: (monster: Monster) => void;
  removeMonster: (id: string) => void;
  clearCollection: () => void;
  syncWithCloud: () => Promise<void>;
  getTopMonsters: () => { name: string; count: number }[];
  getTotalByCategory: () => { category: string; count: number; color: string }[];
  getTotalCaffeine: () => number;
}

export const useMonsterStore = create<MonsterStore>()(
  persist(
    (set, get) => ({
      collection: [],
      loading: false,

      addMonster: async (monster) => {
        // Enrich with local database info
        const dbEntry = findMonsterByBarcode(monster.barcode);
        const enriched: Monster = {
          ...monster,
          name: dbEntry?.name || monster.name,
          caffeine: dbEntry?.caffeine || monster.caffeine || 160,
          category: dbEntry?.category || monster.category,
          color: dbEntry?.color || monster.color || '#00FF41',
          image: dbEntry?.image || monster.image,
        };

        set((state) => ({
          collection: [enriched, ...state.collection]
        }));

        // Sync with Supabase if user is logged in
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('monsters').insert({
              user_id: user.id,
              name: enriched.name,
              barcode: enriched.barcode,
              image: enriched.image,
              caffeine: enriched.caffeine,
              external_id: enriched.id,
              category: enriched.category,
              color: enriched.color,
            });
          }
        } catch {
          // Offline mode — silently fail
        }
      },

      removeMonster: async (id) => {
        set((state) => ({
          collection: state.collection.filter((m) => m.id !== id)
        }));

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('monsters').delete().match({ external_id: id, user_id: user.id });
          }
        } catch {
          // Offline mode
        }
      },

      clearCollection: () => {
        set({ collection: [] });
      },

      syncWithCloud: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const currentCollection = get().collection;
          set({ loading: true });

          const { data, error } = await supabase
            .from('monsters')
            .select('*')
            .eq('user_id', user.id);

          if (data && !error) {
            const cloudMonsters: Monster[] = data.map(item => ({
              id: item.external_id,
              name: item.name,
              barcode: item.barcode,
              dateAdded: new Date(item.inserted_at).toLocaleDateString('fr-FR'),
              image: item.image,
              caffeine: item.caffeine || 160,
              category: item.category,
              color: item.color,
            }));

            if (JSON.stringify(cloudMonsters) !== JSON.stringify(currentCollection)) {
              set({ collection: cloudMonsters });
            }
          }
          set({ loading: false });
        } catch {
          set({ loading: false });
        }
      },

      getTopMonsters: () => {
        const collection = get().collection;
        const counts: Record<string, number> = {};
        collection.forEach(m => {
          counts[m.name] = (counts[m.name] || 0) + 1;
        });
        return Object.entries(counts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      },

      getTotalByCategory: () => {
        const collection = get().collection;
        const counts: Record<string, number> = {};
        collection.forEach(m => {
          const cat = m.category || 'Original';
          counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.entries(counts)
          .map(([category, count]) => ({
            category,
            count,
            color: CATEGORY_COLORS[category as MonsterCategory]?.primary || '#00FF41',
          }))
          .sort((a, b) => b.count - a.count);
      },

      getTotalCaffeine: () => {
        return get().collection.reduce((acc, m) => acc + (m.caffeine || 0), 0);
      },
    }),
    {
      name: 'monster-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
