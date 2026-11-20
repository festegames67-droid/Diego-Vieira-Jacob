export type EditionId = 'sunset' | 'cyan' | 'tropics' | 'noir';

export interface BottleEdition {
  id: EditionId;
  name: string;
  subtitle: string;
  tagline: string;
  price: number;
  image: string;
  imageAlt: string;
  gradientStops: [string, string, string];
  accentHex: string;
  secondaryHex: string;
  lanyardAccent: string;
  badgeText: string;
}

export const EDITIONS: Record<EditionId, BottleEdition> = {
  sunset: {
    id: 'sunset',
    name: 'Ocean Drive Sunset',
    subtitle: 'Magenta Neon · Tangerina · Roxo Noturno',
    tagline:
      'Inspirada no entardecer dourado da Ocean Drive, com transição fosca vibrante de magenta para laranja sunset.',
    price: 189,
    image: '/src/assets/images/bubi_vice_sunset_1795205814270.jpg',
    imageAlt:
      'Garrafa térmica BUBI VICE 650 ml edição Ocean Drive Sunset em degradê fosco magenta e laranja com tampa flip-top com botão e cordão trançado.',
    gradientStops: ['#FF2E93', '#FF7A00', '#240B3B'],
    accentHex: '#FF2E93',
    secondaryHex: '#FF7A00',
    lanyardAccent: '#FF2E93',
    badgeText: 'Mais Vendida',
  },
  cyan: {
    id: 'cyan',
    name: 'Miami Neon Cyan',
    subtitle: 'Ciano Elétrico · Rosa Choque · Índigo',
    tagline:
      'Luzes de néon refletidas na baía de Miami: topo em ciano elétrico fundido com rosa choque sobre base índigo profunda.',
    price: 189,
    image: '/src/assets/images/bubi_vice_cyan_1795205813988.jpg',
    imageAlt:
      'Garrafa térmica BUBI VICE 650 ml edição Miami Neon Cyan em degradê fosco ciano elétrico e rosa com tampa flip-top e alça de cordão.',
    gradientStops: ['#00E5FF', '#FF2E93', '#14092E'],
    accentHex: '#00E5FF',
    secondaryHex: '#FF2E93',
    lanyardAccent: '#00E5FF',
    badgeText: 'Edição Neon',
  },
  tropics: {
    id: 'tropics',
    name: 'Palm Tropics',
    subtitle: 'Menta Tropical · Lagoa · Coral Sunset',
    tagline:
      'Clima tropical costeiro com degradê fosco de menta turquesa até coral flamingo, pensado para treinos e longas sessões.',
    price: 189,
    image: '/src/assets/images/bubi_vice_tropics_1795205813658.jpg',
    imageAlt:
      'Garrafa térmica BUBI VICE 650 ml edição Palm Tropics em degradê fosco menta tropical e coral com tampa flip-top aberta e cordão esportivo.',
    gradientStops: ['#00E5A3', '#008CA8', '#FF6B78'],
    accentHex: '#00E5A3',
    secondaryHex: '#FF6B78',
    lanyardAccent: '#00E5A3',
    badgeText: 'Edição Tropical',
  },
  noir: {
    id: 'noir',
    name: 'Vice Noir',
    subtitle: 'Preto Fosco · Violeta Neon · Âmbar',
    tagline:
      'Estética gamer furtiva com corpo preto fosco aveludado e brilho degradê violeta e âmbar na base para setups escuros.',
    price: 199,
    image: '/src/assets/images/bubi_vice_noir_1795205814437.jpg',
    imageAlt:
      'Garrafa térmica BUBI VICE 650 ml edição Vice Noir em degradê preto fosco com reflexo violeta e âmbar, tampa flip-top metálica e cordão preto.',
    gradientStops: ['#161321', '#6D28D9', '#FF9E00'],
    accentHex: '#9D4EDD',
    secondaryHex: '#FF9E00',
    lanyardAccent: '#9D4EDD',
    badgeText: 'Edição Stealth',
  },
};

export const EDITION_ORDER: EditionId[] = ['sunset', 'cyan', 'tropics', 'noir'];

export const BOTTLE_SPECS = [
  { label: 'Capacidade', value: '650 ml' },
  { label: 'Acabamento', value: 'Powder-coat fosco degradê' },
  { label: 'Tampa', value: 'Flip-top com trava e botão frontal' },
  { label: 'Transporte', value: 'Cordão trançado + mosquetão giratório' },
  { label: 'Isolamento', value: 'Aço inox 18/8 dupla parede (24h frio / 12h quente)' },
  { label: 'Dimensões', value: '24,2 cm altura × 7,4 cm diâmetro' },
];
