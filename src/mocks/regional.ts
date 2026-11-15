import type { AttributeValue, ProducerType, UnitCode } from '@/types/models'
import { cityById, type City } from '@/config/cities'
import type { CertificationCode } from '@/config/certifications'
import type { ProducerSeed } from './producers'
import type { ProductTemplate } from './catalog/types'

type Tri = [en: string, de: string, ro: string]
type Attrs = Record<string, AttributeValue>

interface Row {
  city: City
  producer: string
  type: ProducerType
  category: string
  names: Tri
  unit: UnitCode
  moq: number
  eur: number
  stock: [number, number]
  attributes: Attrs
  certs: CertificationCode[]
  shelf?: [number, number]
}

const veg = (variety: string, cls: string, cal: number | undefined, temp: number, pack: string, organic = false): Attrs => ({
  variety,
  qualityClass: cls,
  organic,
  ...(cal ? { caliberMm: cal } : {}),
  storageTempC: temp,
  packaging: pack,
})
const mach = (model: string, extra: Attrs): Attrs => ({ model, condition: 'new', yearOfManufacture: 2026, warrantyMonths: 24, ...extra })
const input = (ai: string, formulation: string, crop: string, pack: string, extra: Attrs = {}): Attrs => ({
  activeIngredient: ai,
  formulation,
  cropType: crop,
  packSize: pack,
  organicApproved: false,
  hazardClass: 'none',
  sdsAvailable: true,
  ...extra,
})

const R = (
  cityId: string,
  producer: string,
  type: ProducerType,
  category: string,
  names: Tri,
  unit: UnitCode,
  moq: number,
  eur: number,
  stock: [number, number],
  attributes: Attrs,
  certs: CertificationCode[],
  shelf?: [number, number],
): Row => ({ city: cityById(cityId), producer, type, category, names, unit, moq, eur, stock, attributes, certs, shelf })

const ROWS: Row[] = [
  R('ro-husi', 'Crama Dealurile Hușilor', 'farm', 'grapes', ['Wine grapes Busuioacă de Bohotin', 'Keltertrauben Busuioacă de Bohotin', 'Struguri de vin Busuioacă de Bohotin'], 't', 2, 680, [20, 90], veg('Busuioacă de Bohotin', 'class_i', undefined, 8, 'bulk'), ['globalgap', 'pdo'], [3, 6]),
  R('ro-dragasani', 'Podgoria Oltului', 'cooperative', 'grapes', ['Wine grapes Crâmpoșie Selecționată', 'Keltertrauben Crâmpoșie Selecționată', 'Struguri de vin Crâmpoșie Selecționată'], 't', 2, 590, [30, 120], veg('Crâmpoșie Selecționată', 'class_i', undefined, 8, 'bulk'), ['globalgap', 'pdo'], [3, 6]),
  R('ro-falticeni', 'Livada Fălticeni', 'farm', 'pome-fruit', ['Florina apples, scab-resistant', 'Äpfel Florina, schorfresistent', 'Mere Florina, rezistente la rapăn'], 'kg', 1000, 0.58, [15000, 60000], veg('Florina', 'class_i', 75, 2, 'crate'), ['globalgap'], [60, 150]),
  R('ro-radauti', 'Agro Bucovina Rădăuți', 'farm', 'root-vegetables', ['Table potatoes Riviera', 'Speisekartoffeln Riviera', 'Cartofi de consum Riviera'], 't', 5, 290, [80, 400], veg('Riviera', 'class_i', 55, 6, 'big_bag'), ['globalgap'], [60, 120]),
  R('ro-dorohoi', 'Ferma Dorohoi Verde', 'farm', 'brassicas', ['Pickling cabbage, firm heads', 'Sauerkrautkohl, feste Köpfe', 'Varză pentru murat, căpățâni ferme'], 't', 2, 210, [40, 250], veg('Buzău', 'class_i', undefined, 2, 'big_bag'), ['globalgap'], [45, 90]),
  R('ro-tecuci', 'Legume Tecuci', 'farm', 'greenhouse-vegetables', ['Field tomatoes for processing', 'Freilandtomaten für die Verarbeitung', 'Roșii de câmp pentru industrializare'], 't', 5, 260, [60, 300], veg('Heinz 1015', 'class_ii', 55, 12, 'bulk'), ['globalgap'], [4, 8]),
  R('ro-ramnicu-sarat', 'Grădinile Râmnicului', 'cooperative', 'greenhouse-vegetables', ['Gogoșari peppers, red', 'Gogoșari-Paprika, rot', 'Ardei gogoșari roșii'], 'kg', 500, 1.05, [4000, 20000], veg('Gogoșar Ratund', 'class_i', 70, 8, 'crate'), ['globalgap'], [8, 16]),
  R('ro-slobozia', 'Pepeniera Ialomiței', 'farm', 'melons', ['Cantaloupe melons', 'Cantaloupe-Melonen', 'Pepeni galbeni cantaloupe'], 'kg', 1000, 0.75, [10000, 40000], veg('Charentais', 'class_i', undefined, 8, 'carton'), ['globalgap'], [10, 18]),
  R('ro-fetesti', 'Ferma Borcea', 'farm', 'melons', ['Watermelons, striped, 8–12 kg', 'Wassermelonen, gestreift, 8–12 kg', 'Pepeni verzi dungați, 8–12 kg'], 't', 5, 260, [60, 300], veg('Lady', 'class_i', undefined, 10, 'bulk'), ['globalgap'], [14, 28]),
  R('ro-alexandria', 'Teleorman Legume', 'farm', 'root-vegetables', ['Bunched carrots with tops', 'Bundmöhren mit Laub', 'Morcovi în legături, cu frunze'], 'kg', 300, 1.15, [2000, 9000], veg('Napoli', 'class_i', 30, 2, 'crate'), ['globalgap'], [6, 12]),
  R('ro-rosiorii-de-vede', 'Agro Vedea', 'farm', 'leafy-vegetables', ['Spring onions, bunches', 'Frühlingszwiebeln, Bund', 'Ceapă verde, legături'], 'kg', 200, 1.6, [1000, 6000], veg('Ishikura', 'class_i', undefined, 2, 'crate'), ['globalgap'], [6, 12]),
  R('ro-turnu-magurele', 'Câmpia Dunării Agro', 'farm', 'root-vegetables', ['Butternut squash', 'Butternut-Kürbis', 'Dovleac butternut'], 'kg', 1000, 0.7, [8000, 40000], veg('Waltham', 'class_i', undefined, 12, 'bulk'), ['globalgap'], [60, 120]),
  R('ro-corabia', 'Livezile Corabia', 'farm', 'stone-fruit', ['Nectarines, yellow flesh', 'Nektarinen, gelbfleischig', 'Nectarine cu pulpă galbenă'], 'kg', 300, 1.85, [2000, 9000], veg('Big Top', 'class_i', 67, 2, 'carton'), ['globalgap'], [7, 14]),
  R('ro-bailesti', 'Sere Băilești', 'farm', 'greenhouse-vegetables', ['Pickling cucumbers 6–9 cm', 'Einlegegurken 6–9 cm', 'Castraveți cornichon 6–9 cm'], 'kg', 500, 1.25, [3000, 15000], veg('Excelsior', 'class_i', 25, 10, 'crate'), ['globalgap', 'haccp'], [5, 10]),
  R('ro-caracal', 'Romanați Agro', 'farm', 'brassicas', ['Savoy cabbage', 'Wirsing', 'Varză creață'], 'kg', 500, 0.65, [5000, 25000], veg('Wirosa', 'class_i', undefined, 2, 'crate'), ['globalgap'], [20, 40]),
  R('ro-targu-jiu', 'Pomicola Gorjului', 'cooperative', 'stone-fruit', ['Plums Vânăt românesc', 'Zwetschgen Vânăt românesc', 'Prune Vânăt românesc'], 'kg', 1000, 0.62, [10000, 50000], veg('Vânăt românesc', 'class_ii', 35, 2, 'crate'), ['globalgap'], [10, 21]),
  R('ro-curtea-de-arges', 'Livezile Argeșului', 'farm', 'pome-fruit', ['Jonathan apples', 'Äpfel Jonathan', 'Mere Jonathan'], 'kg', 1000, 0.55, [15000, 60000], veg('Jonathan', 'class_i', 70, 2, 'bulk'), ['globalgap'], [60, 150]),
  R('ro-odorheiu-secuiesc', 'Erdei Bogyó', 'cooperative', 'berries', ['Wild blueberries, frozen IQF', 'Waldheidelbeeren, tiefgekühlt IQF', 'Afine de pădure congelate IQF'], 'kg', 200, 6.4, [2000, 10000], veg('Vaccinium myrtillus', 'extra', 10, -2, 'carton', true), ['organic', 'haccp'], [240, 360]),
  R('ro-vaslui', 'Semințe Podișul Moldovei', 'seed_company', 'seeds', ['Sunflower hybrid MV 1101, high oleic', 'Sonnenblumenhybride MV 1101, high oleic', 'Floarea-soarelui hibrid MV 1101, high oleic'], 'bag', 10, 142, [200, 1200], input('—', 'seed', 'sunflower', '150k seeds', { germinationPct: 94 }), ['certifiedSeed']),
  R('ro-roman', 'Agrofert Siret', 'agrochemical_plant', 'liquid-fertilizers', ['UAN 32 liquid nitrogen', 'AHL 32 Flüssigstickstoff', 'UAN 32 azot lichid'], 't', 24, 310, [400, 2000], input('Urea + ammonium nitrate', 'liquid', 'cereals', 'tanker', { nitrogenPct: 32 }), ['euFertilizer', 'reach']),
  R('ro-pascani', 'BioCompost Moldova', 'agrochemical_plant', 'organic-fertilizers', ['Organic compost, screened 0–10 mm', 'Bio-Kompost, gesiebt 0–10 mm', 'Compost organic cernut 0–10 mm'], 't', 10, 48, [500, 3000], input('Green-waste compost', 'powder', 'all_crops', 'bulk', { organicApproved: true, nitrogenPct: 1.5 }), ['organic']),
  R('ro-onesti', 'Trotuș Chem', 'agrochemical_plant', 'mineral-fertilizers', ['Urea 46% N, granular', 'Harnstoff 46 % N, granuliert', 'Uree 46% N, granulată'], 't', 24, 420, [400, 2500], input('Urea', 'granules', 'cereals', '1 t big bag', { nitrogenPct: 46 }), ['euFertilizer', 'reach']),
  R('ro-adjud', 'Siret Seeds', 'seed_company', 'seeds', ['Maize hybrid SR 380, FAO 380', 'Maishybride SR 380, FAO 380', 'Porumb hibrid SR 380, FAO 380'], 'bag', 20, 139, [300, 1500], input('—', 'seed', 'maize', '80k seeds', { germinationPct: 95 }), ['certifiedSeed']),
  R('ro-jimbolia', 'Banat Seeds', 'seed_company', 'seeds', ['Durum wheat seed, certified C1', 'Hartweizen Saatgut, zertifiziert C1', 'Sămânță de grâu durum, certificată C1'], 't', 2, 610, [40, 200], input('—', 'seed', 'cereals', '500 kg big bag', { germinationPct: 92 }), ['certifiedSeed']),
  R('ro-sannicolau-mare', 'Semințe Banatul de Vest', 'seed_company', 'seeds', ['Rapeseed hybrid BV Turbo', 'Rapshybride BV Turbo', 'Rapiță hibrid BV Turbo'], 'bag', 10, 176, [200, 1000], input('—', 'seed', 'rapeseed', '1.5 M seeds', { germinationPct: 93 }), ['certifiedSeed']),
  R('ro-salonta', 'Bihor Crop Care', 'agrochemical_plant', 'fungicides', ['Copper hydroxide fungicide 50% WG', 'Kupferhydroxid-Fungizid 50 % WG', 'Fungicid cu hidroxid de cupru 50% WG'], 'kg', 50, 9.6, [2000, 10000], input('Copper hydroxide 500 g/kg', 'wg', 'vineyards', '10 kg bag', { organicApproved: true, hazardClass: 'GHS09' }), ['pppAuthorised', 'organic']),
  R('ro-lugoj', 'Utilaje Timiș', 'machinery_maker', 'tillage', ['Disc harrow GD 4.0, 4 m', 'Scheibenegge GD 4.0, 4 m', 'Grapă cu discuri GD 4.0, 4 m'], 'piece', 1, 21500, [2, 8], mach('GD 4.0', { workingWidthM: 4, requiredPowerHp: 150, drive: 'trailed' }), ['ce']),
  R('ro-caransebes', 'Remorci Banat', 'machinery_maker', 'farm-trailers', ['Tandem tipping trailer RT-14, 14 t', 'Tandemkipper RT-14, 14 t', 'Remorcă basculantă tandem RT-14, 14 t'], 'piece', 1, 18900, [2, 8], mach('RT-14', { capacity: '14 t', drive: 'trailed' }), ['ce']),
  R('ro-targoviste', 'Tractor Center Dâmbovița', 'machinery_dealer', 'tractors', ['Utility tractor UT 90, 90 hp', 'Allzwecktraktor UT 90, 90 PS', 'Tractor universal UT 90, 90 CP'], 'piece', 1, 54800, [2, 6], mach('UT 90', { enginePowerHp: 90, drive: '4wd', operatingHours: 0, isobusReady: false }), ['ce', 'euStageV']),
  R('ro-campina', 'Pulverizare Prahova', 'machinery_maker', 'sprayers', ['Trailed sprayer TS 3000, 24 m', 'Anhängespritze TS 3000, 24 m', 'Mașină de stropit tractată TS 3000, 24 m'], 'piece', 1, 39500, [1, 4], mach('TS 3000', { workingWidthM: 24, capacity: '3,000 l', requiredPowerHp: 120, drive: 'trailed', isobusReady: true }), ['ce', 'isobus']),
  R('ro-orastie', 'Mecanica Orăștie', 'machinery_maker', 'seeders-planters', ['Pneumatic seed drill PS 400, 4 m', 'Pneumatische Sämaschine PS 400, 4 m', 'Semănătoare pneumatică PS 400, 4 m'], 'piece', 1, 27800, [1, 5], mach('PS 400', { workingWidthM: 4, requiredPowerHp: 110, drive: 'mounted' }), ['ce']),
  R('ro-blaj', 'Târnave Attachments', 'machinery_maker', 'loaders-attachments', ['Front loader FL 1600 with bucket', 'Frontlader FL 1600 mit Schaufel', 'Încărcător frontal FL 1600 cu cupă'], 'piece', 1, 7400, [3, 10], mach('FL 1600', { capacity: '1.6 t', drive: 'mounted' }), ['ce']),
  R('ro-miercurea-ciuc', 'Lăptăria Valea Oltului', 'dairy', 'cheese', ['Smoked cașcaval, 1 kg wheels', 'Geräucherter Cașcaval, 1-kg-Laibe', 'Cașcaval afumat, roți de 1 kg'], 'kg', 50, 8.4, [500, 3000], { milkType: 'cow', fatContentPct: 45, pasteurized: true, organic: false, ripeningDays: 60, storageTempC: 6 }, ['haccp'], [60, 120]),
  R('ro-sighisoara', 'Unt de Târnava', 'dairy', 'butter-yogurt', ['Butter 82% fat, 10 kg blocks', 'Butter 82 % Fett, 10-kg-Blöcke', 'Unt 82% grăsime, blocuri de 10 kg'], 'kg', 100, 6.2, [1000, 5000], { milkType: 'cow', fatContentPct: 82, pasteurized: true, organic: false, storageTempC: 4 }, ['haccp', 'ifs'], [60, 120]),
  R('ro-fagaras', 'Stâna Făgărașului', 'dairy', 'cheese', ['Brânză de burduf, sheep cheese', 'Brânză de burduf, Schafskäse', 'Brânză de burduf de oaie'], 'kg', 20, 11.8, [200, 1200], { milkType: 'sheep', fatContentPct: 48, pasteurized: false, organic: false, ripeningDays: 30, storageTempC: 4 }, ['haccp', 'pgi'], [45, 90]),
  R('ro-dej', 'Lacto Someș', 'dairy', 'milk-cream', ['Whole milk 3.5%, bulk tanker', 'Vollmilch 3,5 %, Tankwagen', 'Lapte integral 3,5%, cisternă'], 'l', 5000, 0.42, [50000, 200000], { milkType: 'cow', fatContentPct: 3.5, pasteurized: false, organic: false, storageTempC: 4 }, ['haccp'], [2, 3]),
  R('ro-carei', 'Ecomilk Carei', 'dairy', 'butter-yogurt', ['Organic set yogurt 3.8%', 'Bio-Stichjoghurt 3,8 %', 'Iaurt bio 3,8%'], 'kg', 200, 1.9, [2000, 8000], { milkType: 'cow', fatContentPct: 3.8, pasteurized: true, organic: true, storageTempC: 4 }, ['organic', 'haccp'], [21, 28]),
  R('ro-reghin', 'Carmangeria Gurghiu', 'meat_processor', 'pork', ['Pork shoulder, boneless', 'Schweineschulter, ohne Knochen', 'Spată de porc dezosată'], 'kg', 300, 3.9, [2000, 8000], { species: 'pork', cut: 'primal', state: 'chilled', organic: false, storageTempC: 2 }, ['haccp', 'ifs'], [8, 12]),
  R('ro-beius', 'Vita de Bihor', 'meat_processor', 'beef', ['Beef hindquarters, Simmental', 'Rinderhinterviertel, Fleckvieh', 'Sferturi posterioare de vită Bălțată'], 'kg', 400, 7.4, [1500, 6000], { species: 'beef', cut: 'half_carcass', state: 'chilled', organic: false, storageTempC: 2 }, ['haccp'], [10, 16]),
  R('ro-babadag', 'Pasărea Dobrogei', 'meat_processor', 'poultry', ['Free-range whole chickens', 'Freiland-Hähnchen, ganz', 'Pui întregi crescuți liber'], 'kg', 300, 3.6, [2000, 10000], { species: 'poultry', cut: 'carcass', state: 'chilled', organic: false, storageTempC: 2 }, ['haccp', 'halal'], [7, 10]),
  R('ro-gheorgheni', 'Cherestea Gheorgheni', 'sawmill', 'structural-timber', ['Spruce beams C24, kiln-dried', 'Fichtenbalken C24, technisch getrocknet', 'Grinzi de molid C24, uscate'], 'm3', 5, 340, [80, 500], { species: 'spruce', dimensions: '100 × 200 × 4000–6000 mm', moisturePct: 15, treatment: 'kiln_dried', strengthGrade: 'C24' }, ['pefc', 'en14081', 'ce']),
  R('ro-sighetu-marmatiei', 'Lemn Maramureș', 'sawmill', 'sawn-timber', ['Beech boards 32 mm, steamed', 'Buchenbretter 32 mm, gedämpft', 'Scânduri de fag 32 mm, aburite'], 'm3', 2, 560, [20, 150], { species: 'beech', dimensions: '32 × 100–250 × 2000–4000 mm', moisturePct: 10, treatment: 'kiln_dried' }, ['fsc']),
  R('ro-petrosani', 'Silva Jiu', 'sawmill', 'sawn-timber', ['Larch cladding 21 mm, planed', 'Lärchen-Fassadenschalung 21 mm, gehobelt', 'Lambriu de larice 21 mm, rindeluit'], 'm2', 50, 24, [2000, 9000], { species: 'larch', dimensions: '21 × 121 × 3000–5000 mm', moisturePct: 14, treatment: 'untreated' }, ['pefc']),
  R('ro-barlad', 'Balastiera Bârladului', 'quarry', 'sand', ['River sand 0/2, washed', 'Flusssand 0/2, gewaschen', 'Nisip de râu 0-2, spălat'], 't', 26, 11, [3000, 20000], { grainSize: '0/4', rockType: 'river_gravel', washed: true, bulkDensityTm3: 1.6 }, ['en12620', 'ce']),
  R('ro-mangalia', 'Cariera Dobrogea Sud', 'quarry', 'crushed-stone', ['Limestone aggregate 16/32', 'Kalksteinschotter 16/32', 'Piatră spartă de calcar 16-32'], 't', 26, 14.5, [3000, 25000], { grainSize: '16/32', rockType: 'limestone', washed: false, bulkDensityTm3: 1.5 }, ['en13242', 'ce']),

  R('hu-kecskemet', 'Kecskeméti Barack', 'farm', 'stone-fruit', ['Apricots Gönci magyarkajszi', 'Aprikosen Gönci magyarkajszi', 'Caise Gönci magyarkajszi'], 'kg', 300, 2.3, [2000, 8000], veg('Gönci magyarkajszi', 'class_i', 45, 2, 'carton'), ['globalgap'], [7, 14]),
  R('hu-nyiregyhaza', 'Szabolcsi Alma', 'cooperative', 'pome-fruit', ['Red Jonaprince apples', 'Äpfel Red Jonaprince', 'Mere Red Jonaprince'], 'kg', 1000, 0.64, [20000, 90000], veg('Red Jonaprince', 'class_i', 75, 2, 'bulk'), ['globalgap'], [60, 150]),
  R('hu-mako', 'Makói Hagyma', 'cooperative', 'root-vegetables', ['Makó onions, yellow', 'Makó-Zwiebeln, gelb', 'Ceapă de Makó, galbenă'], 't', 5, 330, [60, 300], veg('Makói bronz', 'class_i', 60, 2, 'big_bag'), ['globalgap', 'pdo'], [90, 150]),
  R('hu-hodmezovasarhely', 'Vásárhelyi Paprika', 'farm', 'greenhouse-vegetables', ['White pointed peppers', 'Weiße Spitzpaprika', 'Ardei alb ascuțit'], 'kg', 300, 1.7, [2000, 9000], veg('Hó', 'class_i', 50, 8, 'carton'), ['globalgap'], [8, 16]),
  R('hu-cegled', 'Ceglédi Gyümölcs', 'farm', 'stone-fruit', ['Sweet cherries Germersdorfi', 'Süßkirschen Germersdorfer', 'Cireșe Germersdorf'], 'kg', 200, 4.1, [1000, 5000], veg('Germersdorfi', 'class_i', 26, 1, 'carton'), ['globalgap'], [7, 14]),
  R('hu-eger', 'Egri Szőlőbirtok', 'farm', 'grapes', ['Wine grapes Kékfrankos', 'Keltertrauben Blaufränkisch', 'Struguri de vin Kékfrankos'], 't', 2, 640, [20, 100], veg('Kékfrankos', 'class_i', undefined, 8, 'bulk'), ['globalgap', 'pdo'], [3, 6]),
  R('hu-szekszard', 'Szekszárdi Pincészet', 'farm', 'grapes', ['Wine grapes Kadarka', 'Keltertrauben Kadarka', 'Struguri de vin Kadarka'], 't', 2, 720, [15, 80], veg('Kadarka', 'class_i', undefined, 8, 'bulk'), ['globalgap', 'pdo'], [3, 6]),
  R('hu-kiskunhalas', 'Halasi Dinnye', 'farm', 'melons', ['Galia melons', 'Galia-Melonen', 'Pepeni galbeni Galia'], 'kg', 1000, 0.9, [8000, 30000], veg('Galia', 'class_i', undefined, 8, 'carton'), ['globalgap'], [10, 18]),
  R('hu-mateszalka', 'Szatmári Szilva', 'cooperative', 'stone-fruit', ['Szatmár plums Besztercei', 'Zwetschgen Besztercei', 'Prune Besztercei din Satmar'], 'kg', 1000, 0.7, [10000, 40000], veg('Besztercei', 'class_i', 35, 2, 'crate'), ['globalgap'], [10, 21]),
  R('hu-jaszbereny', 'Jászsági Zöldség', 'farm', 'leafy-vegetables', ['Butterhead lettuce', 'Kopfsalat', 'Salată verde de căpățână'], 'kg', 200, 1.4, [1000, 6000], veg('Analena', 'class_i', undefined, 3, 'carton'), ['globalgap'], [5, 10]),
  R('hu-oroshaza', 'Orosházi Gyökér', 'farm', 'root-vegetables', ['Parsley root', 'Petersilienwurzel', 'Rădăcină de pătrunjel'], 'kg', 300, 1.6, [2000, 8000], veg('Berlini', 'class_i', 35, 2, 'carton'), ['globalgap'], [30, 60]),
  R('hu-keszthely', 'Balatoni Eper', 'farm', 'berries', ['Strawberries Clery, 500 g', 'Erdbeeren Clery, 500 g', 'Căpșuni Clery, 500 g'], 'kg', 100, 5.4, [500, 3000], veg('Clery', 'class_i', 30, 2, 'carton'), ['globalgap'], [4, 8]),
  R('hu-kaposvar', 'Somogy Vetőmag', 'seed_company', 'seeds', ['Maize hybrid SV 350, FAO 350', 'Maishybride SV 350, FAO 350', 'Porumb hibrid SV 350, FAO 350'], 'bag', 20, 148, [300, 1500], input('—', 'seed', 'maize', '80k seeds', { germinationPct: 95 }), ['certifiedSeed']),
  R('hu-szolnok', 'Tisza-Chem Szolnok', 'agrochemical_plant', 'insecticides', ['Insecticide, deltamethrin 25 g/l', 'Insektizid, Deltamethrin 25 g/l', 'Insecticid, deltametrin 25 g/l'], 'l', 20, 19.5, [800, 4000], input('Deltamethrin 25 g/l', 'ec', 'cereals', '1 l bottle', { hazardClass: 'GHS09' }), ['pppAuthorised']),
  R('hu-bekescsaba', 'Viharsarok Seeds', 'seed_company', 'seeds', ['Sunflower hybrid VS Delta, Clearfield', 'Sonnenblumenhybride VS Delta, Clearfield', 'Floarea-soarelui hibrid VS Delta, Clearfield'], 'bag', 10, 151, [200, 1000], input('—', 'seed', 'sunflower', '150k seeds', { germinationPct: 95 }), ['certifiedSeed']),
  R('hu-karcag', 'Nagykun Gabona', 'seed_company', 'seeds', ['Winter wheat seed GK Bekes, C1', 'Winterweizen Saatgut GK Bekes, C1', 'Sămânță de grâu GK Bekes, C1'], 't', 2, 545, [50, 250], input('—', 'seed', 'cereals', '500 kg big bag', { germinationPct: 93 }), ['certifiedSeed']),
  R('hu-berettyoujfalu', 'Bihari Biotrágya', 'agrochemical_plant', 'organic-fertilizers', ['Pelleted chicken manure 4-3-3', 'Pelletierter Hühnermist 4-3-3', 'Gunoi de pasăre peletizat 4-3-3'], 't', 5, 230, [80, 400], input('Composted poultry manure', 'granules', 'all_crops', '25 kg bag', { organicApproved: true, nitrogenPct: 4, phosphorusPct: 3, potassiumPct: 3 }), ['organic', 'euFertilizer']),
  R('hu-mosonmagyarovar', 'Szigetközi Vetőmag', 'seed_company', 'seeds', ['Soybean seed, group 0', 'Sojabohnen Saatgut, Reifegruppe 0', 'Sămânță de soia, grupa 0'], 'bag', 20, 44, [400, 2000], input('—', 'seed', 'all_crops', '25 kg bag', { germinationPct: 90 }), ['certifiedSeed']),
  R('hu-szekesfehervar', 'Fehérvár Gépgyár', 'machinery_maker', 'telehandlers', ['Telehandler TL 4.0, 4 t / 7 m', 'Teleskoplader TL 4.0, 4 t / 7 m', 'Încărcător telescopic TL 4.0, 4 t / 7 m'], 'piece', 1, 82000, [1, 4], mach('TL 4.0', { enginePowerHp: 120, capacity: '4 t / 7 m', drive: '4wd', operatingHours: 0, isobusReady: false }), ['ce', 'euStageV']),
  R('hu-szombathely', 'Vasi Mezőgép', 'machinery_maker', 'hay-forage', ['Fixed-chamber round baler FB 125', 'Festkammer-Rundballenpresse FB 125', 'Presă de baloți cu cameră fixă FB 125'], 'piece', 1, 29500, [1, 4], mach('FB 125', { workingWidthM: 2, requiredPowerHp: 70, drive: 'trailed' }), ['ce']),
  R('hu-paks', 'Paksi Pótkocsi', 'machinery_maker', 'farm-trailers', ['Three-way tipper PK 10, 10 t', 'Dreiseitenkipper PK 10, 10 t', 'Remorcă basculantă trilaterală PK 10, 10 t'], 'piece', 1, 15200, [2, 6], mach('PK 10', { capacity: '10 t', drive: 'trailed' }), ['ce']),
  R('hu-baja', 'Bajai Vetőgép', 'machinery_maker', 'seeders-planters', ['Precision planter PV-8, 8 rows', 'Einzelkornsämaschine PV-8, 8-reihig', 'Semănătoare de precizie PV-8, 8 rânduri'], 'piece', 1, 36800, [1, 4], mach('PV-8', { workingWidthM: 6, requiredPowerHp: 130, drive: 'mounted', isobusReady: true }), ['ce', 'isobus']),
  R('hu-nagykanizsa', 'Kanizsa Talajművelő', 'machinery_maker', 'tillage', ['Chisel plough CP-7, 7 tines', 'Schwergrubber CP-7, 7 Zinken', 'Cizel CP-7, 7 organe'], 'piece', 1, 9800, [2, 8], mach('CP-7', { workingWidthM: 3, requiredPowerHp: 130, drive: 'mounted' }), ['ce']),
  R('hu-sopron', 'Soproni Sajtműhely', 'dairy', 'cheese', ['Trappist cheese, 3 kg blocks', 'Trappistenkäse, 3-kg-Blöcke', 'Cașcaval Trappista, blocuri de 3 kg'], 'kg', 60, 6.8, [800, 4000], { milkType: 'cow', fatContentPct: 45, pasteurized: true, organic: false, ripeningDays: 35, storageTempC: 6 }, ['haccp', 'ifs'], [60, 120]),
  R('hu-zalaegerszeg', 'Zalatej', 'dairy', 'butter-yogurt', ['Sour cream 20%, 5 kg buckets', 'Sauerrahm 20 %, 5-kg-Eimer', 'Smântână 20%, găleți de 5 kg'], 'kg', 200, 2.4, [1500, 6000], { milkType: 'cow', fatContentPct: 20, pasteurized: true, organic: false, storageTempC: 4 }, ['haccp'], [21, 30]),
  R('hu-pecs', 'Mecsek Mangalica', 'meat_processor', 'pork', ['Mangalica pork loin', 'Mangalica-Schweinerücken', 'Cotlet de porc Mangalița'], 'kg', 100, 9.8, [500, 2500], { species: 'pork', cut: 'primal', state: 'chilled', organic: false, storageTempC: 2 }, ['haccp', 'pgi'], [8, 12]),
  R('hu-miskolc', 'Bükki Hús', 'meat_processor', 'beef', ['Grey cattle beef, minced', 'Graurind-Hackfleisch', 'Carne tocată de vită sură'], 'kg', 100, 8.6, [400, 2000], { species: 'beef', cut: 'minced', state: 'frozen', organic: false, storageTempC: -18 }, ['haccp'], [120, 240]),
  R('hu-salgotarjan', 'Nógrádi Baromfi', 'meat_processor', 'poultry', ['Duck breasts, frozen', 'Entenbrust, tiefgekühlt', 'Piept de rață congelat'], 'kg', 200, 8.9, [800, 4000], { species: 'poultry', cut: 'retail_cut', state: 'frozen', organic: false, storageTempC: -18 }, ['haccp'], [180, 360]),
  R('hu-veszprem', 'Bakonyi Kőbánya', 'quarry', 'crushed-stone', ['Limestone chippings 8/16', 'Kalksteinsplitt 8/16', 'Criblură de calcar 8-16'], 't', 26, 15.5, [2000, 20000], { grainSize: '8/16', rockType: 'limestone', washed: true, bulkDensityTm3: 1.5 }, ['en12620', 'ce']),
  R('hu-tatabanya', 'Gerecse Kavics', 'quarry', 'gravel', ['Sandy gravel 0/31.5', 'Kiessand 0/31,5', 'Balast 0-31,5'], 't', 26, 9.8, [3000, 25000], { grainSize: '0/31.5', rockType: 'river_gravel', washed: false, bulkDensityTm3: 1.8 }, ['en13242', 'ce']),

  R('bg-pazardzhik', 'Pazardzhik Greenhouses', 'farm', 'greenhouse-vegetables', ['Pink tomatoes, heirloom type', 'Rosa Tomaten, alte Sorte', 'Roșii roz, soi vechi'], 'kg', 300, 2.2, [2000, 8000], veg('Rozova Magia', 'class_i', 75, 11, 'crate'), ['globalgap'], [6, 12]),
  R('bg-kyustendil', 'Kyustendil Orchards', 'farm', 'pome-fruit', ['Granny Smith apples', 'Äpfel Granny Smith', 'Mere Granny Smith'], 'kg', 1000, 0.72, [10000, 50000], veg('Granny Smith', 'class_i', 75, 2, 'crate'), ['globalgap'], [60, 150]),
  R('bg-petrich', 'Struma Valley Farms', 'farm', 'melons', ['Honeydew melons', 'Honigmelonen', 'Pepeni galbeni honeydew'], 'kg', 1000, 0.85, [8000, 30000], veg('Honey Dew', 'class_i', undefined, 8, 'carton'), ['globalgap'], [14, 21]),
  R('bg-haskovo', 'Thrace Pepper Co.', 'farm', 'greenhouse-vegetables', ['Kurtovska kapiya peppers', 'Kurtovska-Kapia-Paprika', 'Ardei Kurtovska kapiya'], 'kg', 300, 1.75, [2000, 9000], veg('Kurtovska kapiya', 'class_i', 60, 8, 'crate'), ['globalgap'], [8, 16]),
  R('bg-sliven', 'Sliven Vineyards', 'farm', 'grapes', ['Table grapes Bolgar', 'Tafeltrauben Bolgar', 'Struguri de masă Bolgar'], 'kg', 500, 1.3, [3000, 12000], veg('Bolgar', 'class_i', 20, 1, 'crate'), ['globalgap'], [10, 30]),
  R('bg-kardzhali', 'Rhodope Potato', 'cooperative', 'root-vegetables', ['Early potatoes, new crop', 'Frühkartoffeln, neue Ernte', 'Cartofi timpurii, recolta nouă'], 'kg', 1000, 0.6, [10000, 40000], veg('Agata', 'class_i', 45, 6, 'crate'), ['globalgap'], [14, 28]),
  R('bg-kazanlak', 'Rose Valley Berries', 'farm', 'berries', ['Raspberries, frozen IQF', 'Himbeeren, tiefgekühlt IQF', 'Zmeură congelată IQF'], 'kg', 200, 4.4, [2000, 10000], veg('Polka', 'class_i', 18, -2, 'carton'), ['globalgap', 'haccp'], [240, 360]),
  R('bg-blagoevgrad', 'Pirin Greens', 'farm', 'leafy-vegetables', ['Leaf spinach, bunches', 'Blattspinat, Bund', 'Spanac în legături'], 'kg', 200, 1.9, [800, 4000], veg('Matador', 'class_i', undefined, 2, 'crate'), ['globalgap'], [4, 8]),
  R('bg-lovech', 'Osam Fruit', 'farm', 'stone-fruit', ['Plums Stanley, for drying', 'Zwetschgen Stanley zum Trocknen', 'Prune Stanley pentru uscat'], 'kg', 1000, 0.6, [10000, 40000], veg('Stanley', 'class_ii', 38, 2, 'bulk'), ['globalgap'], [10, 21]),
  R('bg-svishtov', 'Danube Plain Vegetables', 'farm', 'brassicas', ['Cauliflower, white, 6 per box', 'Blumenkohl, weiß, 6 pro Kiste', 'Conopidă albă, 6 pe bax'], 'kg', 300, 1.2, [2000, 9000], veg('Clapton', 'class_i', undefined, 2, 'carton'), ['globalgap'], [10, 20]),
  R('bg-dobrich', 'Dobrudzha Seeds', 'seed_company', 'seeds', ['Winter wheat seed Enola, C1', 'Winterweizen Saatgut Enola, C1', 'Sămânță de grâu Enola, C1'], 't', 2, 530, [50, 300], input('—', 'seed', 'cereals', '500 kg big bag', { germinationPct: 92 }), ['certifiedSeed']),
  R('bg-pleven', 'Pleven AgroProtect', 'agrochemical_plant', 'herbicides', ['Cereal herbicide, tribenuron 75% WG', 'Getreideherbizid, Tribenuron 75 % WG', 'Erbicid cereale, tribenuron 75% WG'], 'kg', 5, 62, [200, 1200], input('Tribenuron-methyl 750 g/kg', 'wg', 'cereals', '100 g pack', { hazardClass: 'GHS09' }), ['pppAuthorised']),
  R('bg-vratsa', 'Vratsa Fertilizers', 'agrochemical_plant', 'mineral-fertilizers', ['Ammonium nitrate 34.4% N', 'Ammoniumnitrat 34,4 % N', 'Azotat de amoniu 34,4% N'], 't', 24, 335, [400, 2000], input('Ammonium nitrate', 'prilled', 'all_crops', '600 kg big bag', { nitrogenPct: 34.4, hazardClass: 'GHS03' }), ['euFertilizer', 'reach']),
  R('bg-razgrad', 'Ludogorie Seeds', 'seed_company', 'seeds', ['Coriander seed for sowing', 'Koriandersaatgut', 'Sămânță de coriandru pentru semănat'], 'bag', 10, 64, [100, 600], input('—', 'seed', 'all_crops', '25 kg bag', { germinationPct: 85 }), ['certifiedSeed']),
  R('bg-veliko-tarnovo', 'Yantra Agromachines', 'machinery_maker', 'farm-trailers', ['Grain trailer YT-12, 12 t', 'Getreidewagen YT-12, 12 t', 'Remorcă pentru cereale YT-12, 12 t'], 'piece', 1, 16400, [2, 6], mach('YT-12', { capacity: '12 t', drive: 'trailed' }), ['ce']),
  R('bg-shumen', 'Shumen Tractor Center', 'machinery_dealer', 'tractors', ['Orchard tractor OT 75, narrow', 'Obstbautraktor OT 75, schmal', 'Tractor pentru livezi OT 75, îngust'], 'piece', 1, 46900, [2, 5], mach('OT 75', { enginePowerHp: 75, drive: '4wd', operatingHours: 0, isobusReady: false }), ['ce', 'euStageV']),
  R('bg-yambol', 'Tundzha Sprayers', 'machinery_maker', 'sprayers', ['Air-blast orchard sprayer AS 2000', 'Sprühgerät für Obstbau AS 2000', 'Atomizor pentru livezi AS 2000'], 'piece', 1, 13800, [2, 6], mach('AS 2000', { capacity: '2,000 l', requiredPowerHp: 70, drive: 'trailed' }), ['ce']),
  R('bg-montana', 'Balkan Yogurt', 'dairy', 'butter-yogurt', ['Bulgarian yogurt 3.6%, 400 g', 'Bulgarischer Joghurt 3,6 %, 400 g', 'Iaurt bulgăresc 3,6%, 400 g'], 'kg', 200, 1.7, [2000, 9000], { milkType: 'cow', fatContentPct: 3.6, pasteurized: true, organic: false, storageTempC: 4 }, ['haccp', 'pdo'], [21, 30]),
  R('bg-pernik', 'Struma Dairy', 'dairy', 'cheese', ['Sirene white brined cheese', 'Sirene, weißer Lakenkäse', 'Brânză albă Sirene în saramură'], 'kg', 100, 5.9, [1000, 5000], { milkType: 'cow', fatContentPct: 45, pasteurized: true, organic: false, ripeningDays: 45, storageTempC: 4 }, ['haccp'], [90, 180]),
  R('bg-varna', 'Black Sea Dairy', 'dairy', 'cheese', ['Kashkaval from sheep milk', 'Kashkaval aus Schafsmilch', 'Cașcaval din lapte de oaie'], 'kg', 50, 10.9, [500, 2500], { milkType: 'sheep', fatContentPct: 45, pasteurized: true, organic: false, ripeningDays: 60, storageTempC: 6 }, ['haccp'], [90, 180]),
  R('bg-stara-zagora', 'Zagore Meat', 'meat_processor', 'pork', ['Pork legs, bone-in', 'Schweinekeulen mit Knochen', 'Pulpe de porc cu os'], 'kg', 400, 3.3, [2000, 9000], { species: 'pork', cut: 'primal', state: 'chilled', organic: false, storageTempC: 2 }, ['haccp'], [8, 12]),
  R('bg-vidin', 'Vidin Poultry', 'meat_processor', 'poultry', ['Chicken legs, frozen IQF', 'Hähnchenschenkel, tiefgekühlt IQF', 'Pulpe de pui congelate IQF'], 'kg', 500, 2.4, [4000, 20000], { species: 'poultry', cut: 'retail_cut', state: 'frozen', organic: false, storageTempC: -18 }, ['haccp', 'halal'], [270, 365]),
  R('bg-smolyan', 'Rhodope Timber', 'sawmill', 'structural-timber', ['Spruce construction timber C16', 'Fichten-Bauholz C16', 'Cherestea de molid pentru construcții C16'], 'm3', 5, 285, [80, 400], { species: 'spruce', dimensions: '50 × 150 × 4000 mm', moisturePct: 18, treatment: 'kiln_dried', strengthGrade: 'C16' }, ['pefc', 'en14081', 'ce']),
  R('bg-gabrovo', 'Balkan Beech', 'sawmill', 'sawn-timber', ['Beech squares 50×50 mm', 'Buchenkanteln 50×50 mm', 'Rigle de fag 50×50 mm'], 'm3', 2, 520, [20, 120], { species: 'beech', dimensions: '50 × 50 × 1000–2500 mm', moisturePct: 10, treatment: 'kiln_dried' }, ['fsc']),
  R('bg-burgas', 'Burgas Quartz', 'quarry', 'sand', ['Quartz sand 0/4, washed', 'Quarzsand 0/4, gewaschen', 'Nisip cuarțos 0-4, spălat'], 't', 26, 16, [2000, 15000], { grainSize: '0/4', rockType: 'quartz_sand', washed: true, bulkDensityTm3: 1.6 }, ['en12620', 'ce']),
]

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const ROOT_OF: Record<string, string> = {}
const ROOTS: Record<string, string[]> = {
  'fresh-produce': ['greenhouse-vegetables', 'leafy-vegetables', 'brassicas', 'root-vegetables', 'pome-fruit', 'stone-fruit', 'berries', 'grapes', 'melons'],
  'agro-inputs': ['mineral-fertilizers', 'organic-fertilizers', 'liquid-fertilizers', 'herbicides', 'fungicides', 'insecticides', 'seeds'],
  'agri-machinery': ['tractors', 'telehandlers', 'seeders-planters', 'tillage', 'sprayers', 'farm-trailers', 'loaders-attachments', 'hay-forage'],
  dairy: ['milk-cream', 'cheese', 'butter-yogurt'],
  meat: ['pork', 'beef', 'poultry'],
  timber: ['sawn-timber', 'structural-timber'],
  aggregates: ['sand', 'gravel', 'crushed-stone'],
}
for (const [root, leaves] of Object.entries(ROOTS)) for (const l of leaves) ROOT_OF[l] = root

const PACK: Record<string, Tri> = {
  bulk: ['bulk bins', 'Großkisten', 'containere vrac'],
  crate: ['crates', 'Kisten', 'lăzi'],
  carton: ['cartons', 'Kartons', 'baxuri'],
  big_bag: ['big bags', 'Big-Bags', 'big-bag-uri'],
}

function summary(r: Row): Tri {
  const city = r.city.name
  switch (ROOT_OF[r.category]) {
    case 'fresh-produce': {
      const [en, de, ro] = PACK[String(r.attributes.packaging)] ?? PACK.crate!
      return [`Grown near ${city}, sorted and packed to order in ${en}.`, `Angebaut bei ${city}, sortiert und auf Bestellung in ${de} verpackt.`, `Cultivat lângă ${city}, sortat și ambalat la comandă în ${ro}.`]
    }
    case 'dairy':
      return [`Made in ${city} from local milk, delivered chilled.`, `Hergestellt in ${city} aus regionaler Milch, gekühlt geliefert.`, `Produs în ${city} din lapte local, livrat refrigerat.`]
    case 'meat':
      return r.attributes.state === 'frozen'
        ? [`Processed in ${city}, frozen at −18 °C, traceable per batch.`, `Verarbeitet in ${city}, tiefgekühlt bei −18 °C, chargengenau rückverfolgbar.`, `Procesat în ${city}, congelat la −18 °C, trasabil pe lot.`]
        : [`Slaughtered and cut in ${city}, delivered chilled, traceable per batch.`, `Geschlachtet und zerlegt in ${city}, gekühlt geliefert, chargengenau rückverfolgbar.`, `Sacrificat și tranșat în ${city}, livrat refrigerat, trasabil pe lot.`]
    case 'agri-machinery':
      return [`Delivered from ${city} with commissioning, operator training and spare parts.`, `Lieferung ab ${city} mit Inbetriebnahme, Einweisung und Ersatzteilen.`, `Livrare din ${city} cu punere în funcțiune, instruire și piese de schimb.`]
    case 'agro-inputs':
      return [`Dispatched from ${city} with batch documents and safety data sheet.`, `Versand ab ${city} mit Chargendokumenten und Sicherheitsdatenblatt.`, `Expediat din ${city} cu documente de lot și fișă de securitate.`]
    case 'timber':
      return [`Sawn in ${city} from certified forests, strapped bundles.`, `Gesägt in ${city} aus zertifizierten Wäldern, umreifte Pakete.`, `Debitat în ${city} din păduri certificate, pachete legate.`]
    default:
      return [`Loaded at our pit near ${city} onto 26 t tippers, CE-marked.`, `Verladung an unserer Grube bei ${city} auf 26-t-Kipper, CE-gekennzeichnet.`, `Încărcare la balastiera noastră de lângă ${city} în basculante de 26 t, marcaj CE.`]
  }
}

export const REGIONAL_TEMPLATES: ProductTemplate[] = ROWS.map((r, i) => ({
  key: `r-${slug(r.city.name)}`,
  category: r.category,
  names: { en: r.names[0], de: r.names[1], ro: r.names[2] },
  summary: (([en, de, ro]) => ({ en, de, ro }))(summary(r)),
  keywords: [...new Set([r.city.name, ...r.names.map((n) => n.split(/[ ,]/)[0] ?? '')].filter(Boolean))],
  unit: r.unit,
  moq: r.moq,
  priceEUR: r.eur,
  shelfLifeDays: r.shelf,
  stock: r.stock,
  attributes: ROOT_OF[r.category] === 'fresh-produce' ? { origin: r.city.country, ...r.attributes } : r.attributes,
  certifications: r.certs,
  producers: [`p${30 + i}`],
}))

const TYPE_TEXT: Record<string, { en: string; ro: string }> = {
  farm: { en: 'Family-run farm', ro: 'Fermă de familie' },
  cooperative: { en: 'Growers’ cooperative', ro: 'Cooperativă de producători' },
  dairy: { en: 'Regional dairy', ro: 'Fabrică de lactate regională' },
  meat_processor: { en: 'Meat processor', ro: 'Unitate de procesare a cărnii' },
  sawmill: { en: 'Sawmill', ro: 'Fabrică de cherestea' },
  quarry: { en: 'Aggregates pit', ro: 'Balastieră și carieră' },
  machinery_maker: { en: 'Agricultural machinery manufacturer', ro: 'Producător de utilaje agricole' },
  machinery_dealer: { en: 'Machinery dealer and service centre', ro: 'Dealer de utilaje și centru de service' },
  agrochemical_plant: { en: 'Fertilizer and crop-protection producer', ro: 'Producător de îngrășăminte și produse de protecția plantelor' },
  seed_company: { en: 'Seed breeder and processor', ro: 'Amelioratoare și procesator de semințe' },
}

const LEVELS = ['identity', 'verified', 'verified', 'audited', 'unverified', 'verified', 'identity', 'audited'] as const
const EMPLOYEES = ['1-10', '11-50', '11-50', '51-200', '201-1000'] as const
const SUFFIX: Record<string, string> = { RO: 'SRL', HU: 'Kft.', BG: 'EOOD' }

export const REGIONAL_PRODUCERS: ProducerSeed[] = ROWS.map((r, i) => {
  const { name: city, region, country } = r.city
  const ro = country === 'RO'
  const type = TYPE_TEXT[r.type] ?? TYPE_TEXT.farm!
  const level = LEVELS[i % LEVELS.length]!
  const member = new Date(Date.UTC(2022 + (i % 5), (i * 5) % 12, 1 + ((i * 7) % 27)))
  const root = ROOT_OF[r.category] ?? 'fresh-produce'
  const radius = root === 'agri-machinery' ? 900 : root === 'agro-inputs' ? 700 : root === 'aggregates' ? 90 : root === 'fresh-produce' ? 450 : 400
  return {
    id: `p${30 + i}`,
    name: r.producer,
    legalName: `${r.producer} ${SUFFIX[country] ?? ''}`.trim(),
    type: r.type,
    cityId: r.city.id,
    street: ro ? `Str. Principală ${10 + ((i * 13) % 180)}` : `${['Industrial zone', 'Main road', 'Farm road'][i % 3]} ${5 + ((i * 11) % 90)}`,
    offset: [((i * 17) % 21 - 10) / 1000, ((i * 29) % 21 - 10) / 1000],
    deliveryRadiusKm: radius,
    foundedYear: 1990 + ((i * 7) % 33),
    memberSince: member.toISOString(),
    employees: EMPLOYEES[(i * 3) % EMPLOYEES.length]!,
    spokenLanguages: ro ? ['ro', 'en'] : country === 'HU' ? ['en', 'de'] : ['en'],
    contentLang: ro ? 'ro' : 'en',
    description: ro
      ? `${type.ro} din ${city}, județul ${region}. Livrăm în România, Ungaria și Bulgaria, cu documente complete pentru fiecare transport.`
      : `${type.en} based in ${city}, ${region}. We deliver across Hungary, Romania and Bulgaria with full paperwork for every shipment.`,
    rootCategories: [root],
    level,
    verifiedAt: new Date(member.getTime() + 20 * 86_400_000).toISOString(),
    onTime: 0.8 + ((i * 7) % 18) / 100,
    responseHours: 3 + ((i * 5) % 22),
    disputeRate: ((i * 3) % 5) / 100,
    repeatRate: 0.3 + ((i * 11) % 45) / 100,
    historicDeals: 10 + ((i * 37) % 400),
    certs: r.certs,
    brandHue: (i * 47) % 360,
  }
})
