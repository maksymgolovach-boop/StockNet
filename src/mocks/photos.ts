const P = (...ids: (number | string)[]) => ids.map((id) => (typeof id === 'string' ? `https://images.pexels.com/photos/${id}` : `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`))

const U = (...ids: string[]) => ids.map((id) => `https://images.unsplash.com/photo-${id}`)

const SETS = {
  tomato: P(33749230, 35699715, 36094858),
  cucumber: P(39490165, 7543157, 39154015),
  pepper: P(18640811, 35525568, 28352592),
  potato: P('144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg', 37540986, 10899606),
  onion: P(6316541, 38088072, 12296935),
  carrot: P(13195446, 4193418, 37005123),
  apple: P(38924564, 7642865, 27895576),
  pear: P(35145219, 33192028, 18687841),
  blueberry: P(583837, 545041, 9367686),
  raspberry: P(6316703, 33928758, 579473),
  strawberry: P(19268723, 32726768, 16678046),
  blackberry: P(33129840, 18583247, 11164833),
  buckthorn: P(27627786, 18583247, 33129840),
  cabbage: P(6316537, 15742241, 318412),
  redCabbage: P(318412, 318412, 318412),
  cauliflower: P(32640196, 7572005, 6631953),
  broccoli: P(30893315, 7676071, 17663813),
  lettuce: P(28524414, 15429028, 37154682),
  spinach: P(38571502, 7511845, 8845078),
  herbs: P(6102658, 33930757, 13354859),
  grapes: P(33344322, 29195196, 4828956),
  watermelon: P(38786089, 1591183, 26950757),
  melon: P(17903817, 33176474, 15144972),
  plum: P(17964688, 27533957, 39029998),
  cherry: P(32096797, 1149021, 32287432),
  apricot: P(38277641, 8652426, 31427390),
  peach: P(11063842, 9265739, 27429847),
  garlic: P(30893273, 12955789, 6576763),
  roots: P(20517382, 5758605, 27461735),
  pumpkin: P(29122857, 20707153, 38757013),
  zucchini: P(20180750, 12955936, 28797271),
  eggplant: P(6316542, 18476601, 27441352),
  vegetables: P(14650514, 33749230, 18640811),
  tractor: P(30248663, 8586455, 37386690),
  combine: P(38555850, 30743914, 27037415),
  telehandler: P(16717787, 34132984, 37755468),
  seeder: P(21711154, 39136278, 34010626),
  tillage: P(18868474, 12532708, 31586214),
  sprayer: P(2889440, 8239334, 20280085),
  trailer: P(38693258, 29516209, 38279059),
  loader: P(11530543, 27539606, 32073019),
  hay: P(9198225, 28678915, 30238684),
  mineral: [...U('1777432048471-d6fae85832f9', '1785427427850-5ad75619b19b', '1716016435588-f5db7da707d5'), ...P(32533369), ...U('1785900976288-31f0f42a7364'), ...P(21773935), ...U('1764120331824-6218df337b99', '1566378577671-2375b0a1d4ca')],
  organic: [...U('1784285142743-71b20648d416'), ...P(31190668, 28214180), ...U('1764120331824-6218df337b99')],
  liquid: [...U('1774946103680-3d34a461a581', '1785427427850-5ad75619b19b'), ...P(24260575)],
  protection: P(2889442, 31492484, 20280081),
  wheat: P(54084, 41959, 9854639),
  maize: P(60507, 209389, 27564206),
  sunflower: P(34313442, 9974503, '36943553/pexels-photo-36943553/free-photo-of-close-up-of-harvested-sunflower-heads-in-china.jpeg'),
  soy: P(36063252, 31226914, 33501330),
  seeds: P(38453523, 9854639, 30498561),
} satisfies Record<string, string[]>

type Topic = keyof typeof SETS | 'none'

const FRESH_RULES: [RegExp, Topic][] = [
  [/mushroom|green bean/, 'none'],
  [/tomato/, 'tomato'],
  [/sweet potato|parsnip|celeriac|parsley root|beet|radish/, 'roots'],
  [/potato/, 'potato'],
  [/spring onion|herb|parsley|dill/, 'herbs'],
  [/onion/, 'onion'],
  [/carrot/, 'carrot'],
  [/garlic/, 'garlic'],
  [/pumpkin|squash/, 'pumpkin'],
  [/watermelon/, 'watermelon'],
  [/melon/, 'melon'],
  [/pepper|kapia|gogo/, 'pepper'],
  [/cucumber/, 'cucumber'],
  [/zucchini|courgette/, 'zucchini'],
  [/eggplant|aubergine/, 'eggplant'],
  [/cauliflower/, 'cauliflower'],
  [/broccoli/, 'broccoli'],
  [/red cabbage/, 'redCabbage'],
  [/cabbage|savoy|kohlrabi/, 'cabbage'],
  [/lettuce|romaine|iceberg|rocket/, 'lettuce'],
  [/spinach/, 'spinach'],
  [/grape/, 'grapes'],
  [/plum/, 'plum'],
  [/cherr/, 'cherry'],
  [/apricot/, 'apricot'],
  [/peach|nectarine/, 'peach'],
  [/pear|quince/, 'pear'],
  [/apple/, 'apple'],
  [/blueberr/, 'blueberry'],
  [/raspberr/, 'raspberry'],
  [/strawberr/, 'strawberry'],
  [/buckthorn/, 'buckthorn'],
  [/berr|currant/, 'blackberry'],
]

const FRESH_FALLBACK: Record<string, Topic> = {
  'greenhouse-vegetables': 'vegetables',
  'leafy-vegetables': 'lettuce',
  brassicas: 'cabbage',
  'root-vegetables': 'roots',
  'pome-fruit': 'apple',
  'stone-fruit': 'plum',
  berries: 'blackberry',
  grapes: 'grapes',
  melons: 'melon',
}

const BY_CATEGORY: Record<string, Topic> = {
  tractors: 'tractor',
  'combine-harvesters': 'combine',
  telehandlers: 'telehandler',
  'seeders-planters': 'seeder',
  tillage: 'tillage',
  sprayers: 'sprayer',
  'farm-trailers': 'trailer',
  'loaders-attachments': 'loader',
  'hay-forage': 'hay',
  'mineral-fertilizers': 'mineral',
  'organic-fertilizers': 'organic',
  'liquid-fertilizers': 'liquid',
  herbicides: 'protection',
  fungicides: 'protection',
  insecticides: 'protection',
}

const SEED_RULES: [RegExp, Topic][] = [
  [/maize|corn/, 'maize'],
  [/sunflower/, 'sunflower'],
  [/soy/, 'soy'],
  [/wheat|barley|durum/, 'wheat'],
]

function topicFor(category: string, text: string): Topic {
  if (category === 'seeds') return SEED_RULES.find(([re]) => re.test(text))?.[1] ?? 'seeds'
  if (BY_CATEGORY[category]) return BY_CATEGORY[category]
  if (category in FRESH_FALLBACK) return FRESH_RULES.find(([re]) => re.test(text))?.[1] ?? FRESH_FALLBACK[category] ?? 'none'
  return 'none'
}

/** Pexels and Unsplash stock photos for agricultural machinery, fruit & vegetables and agro inputs; other categories keep placeholders. */
export function stockPhotos(category: string, key: string, nameEn: string): string[] {
  const topic = topicFor(category, `${key} ${nameEn}`.toLowerCase())
  return topic === 'none' ? [] : SETS[topic]
}
