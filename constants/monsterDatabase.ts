/**
 * Monster Energy — Base de données locale exhaustive
 * Chaque entrée contient le nom, barcode EAN-13, caféine (mg/500ml),
 * la catégorie, une couleur représentative de la canette,
 * et l'URL d'image OpenFoodFacts.
 */

export interface MonsterProduct {
  name: string;
  barcode: string;
  caffeine: number; // mg per can
  category: MonsterCategory;
  color: string; // hex color for the can accent
  image: string;
}

export type MonsterCategory =
  | 'Original'
  | 'Ultra'
  | 'Juice'
  | 'Rehab'
  | 'Java'
  | 'Reserve'
  | 'Reign'
  | 'Hydro'
  | 'Punch';

export const CATEGORY_COLORS: Record<MonsterCategory, { primary: string; gradient: [string, string] }> = {
  Original: { primary: '#00FF41', gradient: ['#00FF41', '#00CC33'] },
  Ultra:    { primary: '#C0C0C0', gradient: ['#E8E8E8', '#A0A0A0'] },
  Juice:    { primary: '#FF8C00', gradient: ['#FFB347', '#FF6600'] },
  Rehab:    { primary: '#FFD700', gradient: ['#FFE44D', '#FFB800'] },
  Java:     { primary: '#8B4513', gradient: ['#A0522D', '#6B3410'] },
  Reserve:  { primary: '#C9B037', gradient: ['#E6CC00', '#996515'] },
  Reign:    { primary: '#FF1493', gradient: ['#FF69B4', '#DC143C'] },
  Hydro:    { primary: '#00BFFF', gradient: ['#87CEFA', '#0080FF'] },
  Punch:    { primary: '#FF4500', gradient: ['#FF6347', '#FF2400'] },
};

function buildOFFImageUrl(barcode: string): string {
  // OpenFoodFacts image URL structure:
  // For 13-digit barcodes: split first 9 digits into 3/3/3, then remaining 4
  const padded = barcode.padStart(13, '0');
  const g1 = padded.substring(0, 3);
  const g2 = padded.substring(3, 6);
  const g3 = padded.substring(6, 9);
  const rest = padded.substring(9);
  return `https://images.openfoodfacts.org/images/products/${g1}/${g2}/${g3}/${rest}/front_fr.4.400.jpg`;
}

function buildOFFImageUrlFallback(barcode: string): string {
  const padded = barcode.padStart(13, '0');
  const g1 = padded.substring(0, 3);
  const g2 = padded.substring(3, 6);
  const g3 = padded.substring(6, 9);
  const rest = padded.substring(9);
  return `https://images.openfoodfacts.org/images/products/${g1}/${g2}/${g3}/${rest}/front_en.4.400.jpg`;
}

/**
 * Catalogue complet des Monster Energy
 * Sources: OpenFoodFacts, barcodes réels du marché EU/FR
 */
export const MONSTER_DATABASE: MonsterProduct[] = [
  // ─── ORIGINAL LINE ───────────────────────────
  {
    name: 'Monster Energy Original',
    barcode: '5060166694951',
    caffeine: 160,
    category: 'Original',
    color: '#00FF41',
    image: buildOFFImageUrl('5060166694951'),
  },
  {
    name: 'Monster Energy Absolutely Zero',
    barcode: '5060166694968',
    caffeine: 160,
    category: 'Original',
    color: '#1C1C1C',
    image: buildOFFImageUrl('5060166694968'),
  },
  {
    name: 'Monster Energy Lo-Carb',
    barcode: '0070847811169',
    caffeine: 140,
    category: 'Original',
    color: '#0066CC',
    image: buildOFFImageUrl('0070847811169'),
  },
  {
    name: 'Monster Energy Zero Sugar',
    barcode: '5060751219101',
    caffeine: 150,
    category: 'Original',
    color: '#00FF41',
    image: buildOFFImageUrl('5060751219101'),
  },

  // ─── ULTRA LINE ──────────────────────────────
  {
    name: 'Monster Ultra White',
    barcode: '5060166693350',
    caffeine: 150,
    category: 'Ultra',
    color: '#FFFFFF',
    image: buildOFFImageUrl('5060166693350'),
  },
  {
    name: 'Monster Ultra Blue',
    barcode: '5060751215622',
    caffeine: 150,
    category: 'Ultra',
    color: '#4FC3F7',
    image: buildOFFImageUrl('5060751215622'),
  },
  {
    name: 'Monster Ultra Red',
    barcode: '5060166694241',
    caffeine: 150,
    category: 'Ultra',
    color: '#FF1744',
    image: buildOFFImageUrl('5060166694241'),
  },
  {
    name: 'Monster Ultra Violet',
    barcode: '5060517889456',
    caffeine: 150,
    category: 'Ultra',
    color: '#9C27B0',
    image: buildOFFImageUrl('5060517889456'),
  },
  {
    name: 'Monster Ultra Sunrise',
    barcode: '5060166694234',
    caffeine: 150,
    category: 'Ultra',
    color: '#FF9800',
    image: buildOFFImageUrl('5060166694234'),
  },
  {
    name: 'Monster Ultra Paradise',
    barcode: '5060751210559',
    caffeine: 150,
    category: 'Ultra',
    color: '#66BB6A',
    image: buildOFFImageUrl('5060751210559'),
  },
  {
    name: 'Monster Ultra Fiesta Mango',
    barcode: '5060751214168',
    caffeine: 150,
    category: 'Ultra',
    color: '#FFAB00',
    image: buildOFFImageUrl('5060751214168'),
  },
  {
    name: 'Monster Ultra Rosa',
    barcode: '5060751214175',
    caffeine: 150,
    category: 'Ultra',
    color: '#F48FB1',
    image: buildOFFImageUrl('5060751214175'),
  },
  {
    name: 'Monster Ultra Watermelon',
    barcode: '5060751215639',
    caffeine: 150,
    category: 'Ultra',
    color: '#EF5350',
    image: buildOFFImageUrl('5060751215639'),
  },
  {
    name: 'Monster Ultra Gold',
    barcode: '5060751210566',
    caffeine: 150,
    category: 'Ultra',
    color: '#FFD700',
    image: buildOFFImageUrl('5060751210566'),
  },
  {
    name: 'Monster Ultra Peachy Keen',
    barcode: '5060751219118',
    caffeine: 150,
    category: 'Ultra',
    color: '#FFAB91',
    image: buildOFFImageUrl('5060751219118'),
  },
  {
    name: 'Monster Ultra Black',
    barcode: '5060166694258',
    caffeine: 150,
    category: 'Ultra',
    color: '#212121',
    image: buildOFFImageUrl('5060166694258'),
  },

  // ─── JUICE LINE ──────────────────────────────
  {
    name: 'Monster Juice Mango Loco',
    barcode: '5060517883270',
    caffeine: 160,
    category: 'Juice',
    color: '#FF6D00',
    image: buildOFFImageUrl('5060517883270'),
  },
  {
    name: 'Monster Juice Pipeline Punch',
    barcode: '5060517883287',
    caffeine: 160,
    category: 'Juice',
    color: '#E91E63',
    image: buildOFFImageUrl('5060517883287'),
  },
  {
    name: 'Monster Juice Pacific Punch',
    barcode: '5060751210931',
    caffeine: 160,
    category: 'Juice',
    color: '#7C4DFF',
    image: buildOFFImageUrl('5060751210931'),
  },
  {
    name: 'Monster Juice Khaotic',
    barcode: '5060751210924',
    caffeine: 160,
    category: 'Juice',
    color: '#FF8F00',
    image: buildOFFImageUrl('5060751210924'),
  },
  {
    name: 'Monster Juice Monarch',
    barcode: '5060751215646',
    caffeine: 160,
    category: 'Juice',
    color: '#FF6F00',
    image: buildOFFImageUrl('5060751215646'),
  },
  {
    name: 'Monster Juice Bad Apple',
    barcode: '5060751215653',
    caffeine: 160,
    category: 'Juice',
    color: '#B71C1C',
    image: buildOFFImageUrl('5060751215653'),
  },
  {
    name: 'Monster Juice Aussie Style Lemonade',
    barcode: '5060751219125',
    caffeine: 160,
    category: 'Juice',
    color: '#FDD835',
    image: buildOFFImageUrl('5060751219125'),
  },
  {
    name: 'Monster Juice Rio Punch',
    barcode: '5060751219132',
    caffeine: 160,
    category: 'Juice',
    color: '#00E676',
    image: buildOFFImageUrl('5060751219132'),
  },

  // ─── REHAB LINE ──────────────────────────────
  {
    name: 'Monster Rehab Peach Tea',
    barcode: '0070847032304',
    caffeine: 82,
    category: 'Rehab',
    color: '#FFCC80',
    image: buildOFFImageUrl('0070847032304'),
  },
  {
    name: 'Monster Rehab Lemonade Tea',
    barcode: '0070847032298',
    caffeine: 82,
    category: 'Rehab',
    color: '#FFF59D',
    image: buildOFFImageUrl('0070847032298'),
  },
  {
    name: 'Monster Rehab Raspberry Tea',
    barcode: '0070847032311',
    caffeine: 82,
    category: 'Rehab',
    color: '#F06292',
    image: buildOFFImageUrl('0070847032311'),
  },
  {
    name: 'Monster Rehab Watermelon',
    barcode: '0070847040019',
    caffeine: 82,
    category: 'Rehab',
    color: '#E57373',
    image: buildOFFImageUrl('0070847040019'),
  },

  // ─── RESERVE LINE ────────────────────────────
  {
    name: 'Monster Reserve Orange Dreamsicle',
    barcode: '0070847040033',
    caffeine: 160,
    category: 'Reserve',
    color: '#FF9800',
    image: buildOFFImageUrl('0070847040033'),
  },
  {
    name: 'Monster Reserve Watermelon',
    barcode: '0070847040026',
    caffeine: 160,
    category: 'Reserve',
    color: '#EF5350',
    image: buildOFFImageUrl('0070847040026'),
  },
  {
    name: 'Monster Reserve White Pineapple',
    barcode: '0070847040040',
    caffeine: 160,
    category: 'Reserve',
    color: '#FFF9C4',
    image: buildOFFImageUrl('0070847040040'),
  },

  // ─── HYDRO / HYDRO SUPER SPORT ───────────────
  {
    name: 'Monster Hydro Super Sport Blue Streak',
    barcode: '5060751213031',
    caffeine: 200,
    category: 'Hydro',
    color: '#2196F3',
    image: buildOFFImageUrl('5060751213031'),
  },
  {
    name: 'Monster Hydro Super Sport Red Dawg',
    barcode: '5060751213048',
    caffeine: 200,
    category: 'Hydro',
    color: '#F44336',
    image: buildOFFImageUrl('5060751213048'),
  },

  // ─── PUNCH / ASSAULT / EDITION ───────────────
  {
    name: 'Monster Assault',
    barcode: '5060166693343',
    caffeine: 160,
    category: 'Punch',
    color: '#B71C1C',
    image: buildOFFImageUrl('5060166693343'),
  },
  {
    name: 'Monster Lewis Hamilton',
    barcode: '5060517884345',
    caffeine: 160,
    category: 'Original',
    color: '#BA68C8',
    image: buildOFFImageUrl('5060517884345'),
  },
  {
    name: 'Monster The Doctor (VR46)',
    barcode: '5060517883294',
    caffeine: 160,
    category: 'Original',
    color: '#FFEB3B',
    image: buildOFFImageUrl('5060517883294'),
  },

  // ─── REIGN (brand by Monster Beverage) ───────
  {
    name: 'Reign Total Body Fuel Melon Mania',
    barcode: '0818094006286',
    caffeine: 300,
    category: 'Reign',
    color: '#76FF03',
    image: buildOFFImageUrl('0818094006286'),
  },
  {
    name: 'Reign Total Body Fuel Razzle Berry',
    barcode: '0818094006293',
    caffeine: 300,
    category: 'Reign',
    color: '#E040FB',
    image: buildOFFImageUrl('0818094006293'),
  },
  {
    name: 'Reign Total Body Fuel Lemon HDZ',
    barcode: '0818094006309',
    caffeine: 300,
    category: 'Reign',
    color: '#FFEE58',
    image: buildOFFImageUrl('0818094006309'),
  },
  {
    name: 'Reign Total Body Fuel Orange Dreamsicle',
    barcode: '0818094006316',
    caffeine: 300,
    category: 'Reign',
    color: '#FF9100',
    image: buildOFFImageUrl('0818094006316'),
  },
  {
    name: 'Reign Total Body Fuel Peach Fizz',
    barcode: '0818094006323',
    caffeine: 300,
    category: 'Reign',
    color: '#FFAB91',
    image: buildOFFImageUrl('0818094006323'),
  },

  // ─── JAVA / COFFEE ───────────────────────────
  {
    name: 'Java Monster Mean Bean',
    barcode: '0070847001102',
    caffeine: 188,
    category: 'Java',
    color: '#795548',
    image: buildOFFImageUrl('0070847001102'),
  },
  {
    name: 'Java Monster Loca Moca',
    barcode: '0070847001119',
    caffeine: 188,
    category: 'Java',
    color: '#5D4037',
    image: buildOFFImageUrl('0070847001119'),
  },
  {
    name: 'Java Monster Salted Caramel',
    barcode: '0070847001157',
    caffeine: 188,
    category: 'Java',
    color: '#8D6E63',
    image: buildOFFImageUrl('0070847001157'),
  },
  {
    name: 'Java Monster Swiss Chocolate',
    barcode: '0070847001140',
    caffeine: 188,
    category: 'Java',
    color: '#3E2723',
    image: buildOFFImageUrl('0070847001140'),
  },
  {
    name: 'Java Monster 300 French Vanilla',
    barcode: '0070847001171',
    caffeine: 300,
    category: 'Java',
    color: '#FFF8E1',
    image: buildOFFImageUrl('0070847001171'),
  },

  // ─── EXTRA EU/FR MARKET ──────────────────────
  {
    name: 'Monster Energy Nitro Super Dry',
    barcode: '5060517883256',
    caffeine: 160,
    category: 'Original',
    color: '#B0BEC5',
    image: buildOFFImageUrl('5060517883256'),
  },
  {
    name: 'Monster Energy Mixxd',
    barcode: '5060166694210',
    caffeine: 160,
    category: 'Punch',
    color: '#CE93D8',
    image: buildOFFImageUrl('5060166694210'),
  },
  {
    name: 'Monster Mule Ginger Brew',
    barcode: '5060751210573',
    caffeine: 160,
    category: 'Original',
    color: '#A1887F',
    image: buildOFFImageUrl('5060751210573'),
  },
  {
    name: 'Monster Ultra Fiesta',
    barcode: '5060751214182',
    caffeine: 150,
    category: 'Ultra',
    color: '#FFA726',
    image: buildOFFImageUrl('5060751214182'),
  },
  {
    name: 'Monster Juiced Ripper',
    barcode: '5060166694227',
    caffeine: 160,
    category: 'Juice',
    color: '#4CAF50',
    image: buildOFFImageUrl('5060166694227'),
  },
];

/**
 * Lookup a Monster by barcode — returns the local entry if found.
 */
export function findMonsterByBarcode(barcode: string): MonsterProduct | undefined {
  return MONSTER_DATABASE.find(m => m.barcode === barcode);
}

/**
 * Get all categories in the database
 */
export function getAllCategories(): MonsterCategory[] {
  return [...new Set(MONSTER_DATABASE.map(m => m.category))];
}

/**
 * Get products by category
 */
export function getMonstersByCategory(category: MonsterCategory): MonsterProduct[] {
  return MONSTER_DATABASE.filter(m => m.category === category);
}
