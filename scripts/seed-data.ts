/**
 * Seed listing data for populating the Bikes category.
 *
 * Generates ~192 listings (32 counties x 6 bike types) with
 * county-specific humour and deterministic content.
 */

import type {
	BikeSubtype,
	BikeType,
	BikeCondition,
	BikeSizePreset
} from '../src/lib/category-profiles.js';

// ---------------------------------------------------------------------------
// Bike types to seed
// ---------------------------------------------------------------------------

export const BIKE_TYPES_TO_SEED = [
	'road',
	'mountain',
	'electric',
	'folding',
	'bmx',
	'kids'
] as const;

export type SeedBikeType = (typeof BIKE_TYPES_TO_SEED)[number];

// ---------------------------------------------------------------------------
// Bike type metadata
// ---------------------------------------------------------------------------

export type BikeMeta = {
	subtype: BikeSubtype;
	bikeType: BikeType;
	condition: BikeCondition[];
	sizePresets: BikeSizePreset[];
	priceRange: [number, number];
};

export const BIKE_TYPE_META: Record<SeedBikeType, BikeMeta> = {
	road: {
		subtype: 'adult',
		bikeType: 'road',
		condition: ['used_good', 'used_fair', 'like_new'],
		sizePresets: ['S', 'M', 'L', 'XL'],
		priceRange: [150, 800]
	},
	mountain: {
		subtype: 'adult',
		bikeType: 'mountain',
		condition: ['used_good', 'used_fair', 'needs_work'],
		sizePresets: ['S', 'M', 'L', 'XL'],
		priceRange: [120, 600]
	},
	electric: {
		subtype: 'electric',
		bikeType: 'commuter',
		condition: ['used_good', 'like_new', 'used_fair'],
		sizePresets: ['M', 'L', 'XL'],
		priceRange: [400, 2000]
	},
	folding: {
		subtype: 'adult',
		bikeType: 'folding',
		condition: ['used_good', 'like_new', 'used_fair'],
		sizePresets: ['S', 'M'],
		priceRange: [100, 500]
	},
	bmx: {
		subtype: 'adult',
		bikeType: 'bmx',
		condition: ['used_good', 'used_fair', 'needs_work'],
		sizePresets: ['S', 'M'],
		priceRange: [80, 350]
	},
	kids: {
		subtype: 'kids',
		bikeType: 'mountain',
		condition: ['used_good', 'used_fair', 'like_new'],
		sizePresets: ['3-5', '6-8', '9-12'],
		priceRange: [30, 150]
	}
};

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

const BRANDS = [
	'Trek',
	'Giant',
	'Specialized',
	'Cannondale',
	'Scott',
	'Merida',
	'Boardman',
	'Carrera',
	"B'Twin",
	'Cube',
	'Orbea',
	'Raleigh',
	'Apollo',
	'Viking',
	'Claud Butler',
	'Dawes',
	'Pinnacle',
	'Voodoo',
	'Mongoose',
	'Halfords'
];

// ---------------------------------------------------------------------------
// NI counties (GBP)
// ---------------------------------------------------------------------------

const NI_COUNTY_IDS = new Set([
	'ie/ulster/antrim',
	'ie/ulster/armagh',
	'ie/ulster/down',
	'ie/ulster/fermanagh',
	'ie/ulster/derry',
	'ie/ulster/tyrone'
]);

// ---------------------------------------------------------------------------
// County flavour data
// ---------------------------------------------------------------------------

export type CountyFlavour = {
	demonym: string;
	landmark: string;
	terrain: string;
	localRef: string;
};

export const COUNTY_FLAVOUR: Record<string, CountyFlavour> = {
	// --- Leinster ---
	'ie/leinster/dublin': {
		demonym: 'Dub',
		landmark: 'Phoenix Park',
		terrain: 'canal paths',
		localRef: 'grand stretch in the evening'
	},
	'ie/leinster/wicklow': {
		demonym: 'Wicklow native',
		landmark: 'Glendalough',
		terrain: 'Wicklow Gap trails',
		localRef: 'the Garden County on two wheels'
	},
	'ie/leinster/wexford': {
		demonym: 'Yellow Belly',
		landmark: 'Hook Head',
		terrain: 'Greenway paths',
		localRef: 'strawberry season spins'
	},
	'ie/leinster/carlow': {
		demonym: 'Carlow head',
		landmark: 'Mount Leinster',
		terrain: 'Barrow towpath',
		localRef: "sure it's flat enough for anyone"
	},
	'ie/leinster/kilkenny': {
		demonym: 'Cat',
		landmark: 'Kilkenny Castle',
		terrain: 'Medieval Mile lanes',
		localRef: 'more hurls than handlebars around here'
	},
	'ie/leinster/laois': {
		demonym: 'Laois one',
		landmark: 'Emo Court',
		terrain: 'Slieve Bloom trails',
		localRef: 'the quiet county with decent roads'
	},
	'ie/leinster/offaly': {
		demonym: 'Faithful',
		landmark: 'Clonmacnoise',
		terrain: 'Grand Canal towpath',
		localRef: 'flat as a pancake and twice as grand'
	},
	'ie/leinster/westmeath': {
		demonym: 'Westmeath native',
		landmark: 'Athlone Castle',
		terrain: 'Royal Canal Greenway',
		localRef: 'lakeland cycling at its finest'
	},
	'ie/leinster/longford': {
		demonym: 'Longford local',
		landmark: 'Corlea Trackway',
		terrain: 'Center Parcs trails',
		localRef: 'nothing wrong with flat roads'
	},
	'ie/leinster/meath': {
		demonym: 'Royal',
		landmark: 'Newgrange',
		terrain: 'Boyne Valley lanes',
		localRef: 'older than the pyramids, newer than the bike'
	},
	'ie/leinster/louth': {
		demonym: 'Wee County native',
		landmark: 'Carlingford',
		terrain: 'coast road from Drogheda',
		localRef: 'smallest county, biggest craic'
	},
	'ie/leinster/kildare': {
		demonym: 'Kildare native',
		landmark: 'the Curragh',
		terrain: 'canal towpath to Sallins',
		localRef: 'horse country but bikes are cheaper to feed'
	},

	// --- Munster ---
	'ie/munster/cork': {
		demonym: 'Corkonian',
		landmark: 'the English Market',
		terrain: 'harbour roads',
		localRef: 'the real capital, like'
	},
	'ie/munster/kerry': {
		demonym: 'Kerryman',
		landmark: 'the Ring of Kerry',
		terrain: 'mountain roads',
		localRef: 'grand for the hills'
	},
	'ie/munster/limerick': {
		demonym: 'Treaty man',
		landmark: "King John's Castle",
		terrain: 'Shannon banks path',
		localRef: 'Limerick is class for cycling, in fairness'
	},
	'ie/munster/tipperary': {
		demonym: 'Tipp native',
		landmark: 'the Rock of Cashel',
		terrain: 'Suir Valley trails',
		localRef: "it's a long way, but worth the cycle"
	},
	'ie/munster/clare': {
		demonym: 'Banner person',
		landmark: 'the Cliffs of Moher',
		terrain: 'Burren backroads',
		localRef: 'wild Atlantic cycling'
	},
	'ie/munster/waterford': {
		demonym: 'Deise',
		landmark: 'Waterford Greenway',
		terrain: 'Greenway from Dungarvan',
		localRef: 'the Greenway is the reason you need this bike'
	},

	// --- Connacht ---
	'ie/connacht/galway': {
		demonym: 'Galwegian',
		landmark: 'the Salthill Prom',
		terrain: 'Connemara back roads',
		localRef: 'sure the rain adds character'
	},
	'ie/connacht/mayo': {
		demonym: 'Mayo native',
		landmark: 'Croagh Patrick',
		terrain: 'Great Western Greenway',
		localRef: 'Mayo for Sam, bikes for the rest of us'
	},
	'ie/connacht/sligo': {
		demonym: 'Sligo head',
		landmark: 'Benbulben',
		terrain: 'Yeats Country roads',
		localRef: 'Yeats never had a bike this good'
	},
	'ie/connacht/leitrim': {
		demonym: 'Leitrim local',
		landmark: 'Glencar Waterfall',
		terrain: 'Shannon-Erne trails',
		localRef: 'more sheep than cyclists, but we manage'
	},
	'ie/connacht/roscommon': {
		demonym: 'Rossie',
		landmark: 'Rathcroghan',
		terrain: 'Suck Valley lanes',
		localRef: 'midlands cycling with zero traffic'
	},

	// --- Ulster (Republic) ---
	'ie/ulster/donegal': {
		demonym: 'Donegal native',
		landmark: 'Slieve League',
		terrain: 'Wild Atlantic cliff roads',
		localRef: 'fierce windy out West'
	},
	'ie/ulster/cavan': {
		demonym: 'Breffni',
		landmark: 'Cavan Burren',
		terrain: 'drumlin country lanes',
		localRef: "more hills than you'd expect"
	},
	'ie/ulster/monaghan': {
		demonym: 'Farney',
		landmark: 'Glaslough',
		terrain: 'border country roads',
		localRef: 'Patrick Kavanagh would have cycled this'
	},

	// --- Ulster (Northern Ireland) ---
	'ie/ulster/antrim': {
		demonym: 'Antrim native',
		landmark: "the Giant's Causeway",
		terrain: 'Causeway Coastal Route',
		localRef: 'class scenery along the coast road'
	},
	'ie/ulster/armagh': {
		demonym: 'Armagh local',
		landmark: 'Navan Fort',
		terrain: 'orchard county lanes',
		localRef: 'apple country cycling'
	},
	'ie/ulster/down': {
		demonym: 'Down native',
		landmark: 'the Mourne Mountains',
		terrain: 'Mourne Coastal Route',
		localRef: 'mountains of Mourne sweeping down to the sea'
	},
	'ie/ulster/fermanagh': {
		demonym: 'Fermanagh native',
		landmark: 'Lough Erne',
		terrain: 'lakeland trails',
		localRef: 'lakeside cycling at its best'
	},
	'ie/ulster/derry': {
		demonym: 'Derry native',
		landmark: 'the Walled City',
		terrain: 'Foyle Valley paths',
		localRef: 'class cycling along the Foyle'
	},
	'ie/ulster/tyrone': {
		demonym: 'Tyrone native',
		landmark: 'the Sperrin Mountains',
		terrain: 'Sperrin mountain roads',
		localRef: 'red hand country on two wheels'
	}
};

// ---------------------------------------------------------------------------
// Deterministic seeded random (simple hash-based PRNG)
// ---------------------------------------------------------------------------

function seedHash(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash + char) | 0;
	}
	return Math.abs(hash);
}

function seededRandom(seed: string, index: number): number {
	const h = seedHash(seed + ':' + index);
	const x = Math.sin(h + index) * 10000;
	return x - Math.floor(x);
}

function seededPick<T>(arr: readonly T[], seed: string, index: number): T {
	const i = Math.floor(seededRandom(seed, index) * arr.length);
	return arr[i];
}

function seededInt(min: number, max: number, seed: string, index: number): number {
	return min + Math.floor(seededRandom(seed, index) * (max - min + 1));
}

// ---------------------------------------------------------------------------
// Title generators per seed bike type
// ---------------------------------------------------------------------------

type TitleGenerator = (brand: string, flavour: CountyFlavour, countyName: string) => string;

const TITLE_GENERATORS: Record<SeedBikeType, TitleGenerator[]> = {
	road: [
		(brand, flavour) => `${brand} road bike -- tested on ${flavour.terrain}`,
		(brand, _flavour, county) => `${brand} road bike -- ${county}`,
		(_brand, flavour) => `Road bike -- ${flavour.localRef}`,
		(brand, flavour) => `${brand} racer -- well-worn on ${flavour.terrain}`
	],
	mountain: [
		(_brand, flavour) => `Mountain bike for ${flavour.terrain}`,
		(brand, flavour) => `${brand} MTB -- survived ${flavour.terrain}`,
		(brand, _flavour, county) => `${brand} mountain bike -- ${county}`,
		(_brand, flavour) => `Hardtail mountain bike -- ${flavour.localRef}`
	],
	electric: [
		(_brand, flavour) => `Electric bike -- ${flavour.localRef}`,
		(brand, _flavour, county) => `${brand} e-bike -- ${county}`,
		(_brand, flavour) => `E-bike -- takes the sting out of ${flavour.terrain}`,
		(brand, flavour) => `${brand} electric -- ${flavour.localRef}`
	],
	folding: [
		(_brand, flavour) => `Folding bike -- handy for ${flavour.terrain}`,
		(brand, _flavour, county) => `${brand} folder -- ${county}`,
		(_brand, _flavour, county) => `Folding bike -- fits on the bus in ${county}`,
		(brand, flavour) => `${brand} folding bike -- ${flavour.localRef}`
	],
	bmx: [
		(_brand, flavour) => `BMX -- spent more time at the skatepark than ${flavour.landmark}`,
		(brand, _flavour, county) => `${brand} BMX -- ${county}`,
		(_brand, flavour) => `BMX -- ${flavour.localRef}`,
		(brand, flavour) => `${brand} BMX -- battle-tested near ${flavour.landmark}`
	],
	kids: [
		(_brand, flavour) => `Kids bike -- outgrown faster than ${flavour.localRef}`,
		(brand, _flavour, county) => `${brand} kids bike -- ${county}`,
		(_brand, flavour) => `Kids bike -- barely used near ${flavour.landmark}`,
		(brand, _flavour, county) => `${brand} junior bike -- ${county} collection`
	]
};

// ---------------------------------------------------------------------------
// Description generators per seed bike type
// ---------------------------------------------------------------------------

type DescGenerator = (
	brand: string,
	flavour: CountyFlavour,
	countyName: string,
	condition: string,
	sizePreset: string
) => string;

const ucFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const ROAD_DESCRIPTIONS: DescGenerator[] = [
	(brand, flavour, county) =>
		`${brand} road bike in solid condition. Used for weekend spins along ${flavour.terrain} in ${county}. ` +
		`Shimano gears, alloy frame, new bar tape. ${ucFirst(flavour.localRef)} -- perfect weather for a ride. ` +
		`Collection from ${county}.`,
	(brand, flavour, county) =>
		`Selling this ${brand} because I upgraded. It's done thousands of kilometres along ${flavour.terrain} and still rolls beautifully. ` +
		`Carbon fork, aluminium frame, 105 groupset. A proper ${flavour.demonym} machine. ` +
		`Can be viewed near ${flavour.landmark}, ${county}.`,
	(brand, flavour, county) =>
		`This ${brand} has been my commuter for two years in ${county}. Reliable, light, and fast on ${flavour.terrain}. ` +
		`Recently had it serviced -- new chain, cables, brake pads. Ready to go. ` +
		`Ideal for anyone cycling in ${county}.`,
	(brand, flavour, county) =>
		`Decent ${brand} road bike. Not the fanciest, but it does the job on ${flavour.terrain}. ` +
		`I'm a ${flavour.demonym} who switched to running, so the bike is just gathering dust now. ` +
		`Disc brakes, 21 speeds, mudguards included. Collection near ${flavour.landmark}, ${county}.`
];

const MOUNTAIN_DESCRIPTIONS: DescGenerator[] = [
	(brand, flavour, county) =>
		`${brand} mountain bike -- this thing has seen ${flavour.terrain} more times than I can count. ` +
		`Front suspension, hydraulic disc brakes, knobby tyres still in decent shape. ` +
		`Perfect for trails around ${county}. ${ucFirst(flavour.localRef)}.`,
	(brand, flavour, county) =>
		`Selling my ${brand} hardtail. Brilliant on ${flavour.terrain} and surprisingly good on the road too. ` +
		`Shimano Deore gears, 29-inch wheels, lockout fork. A proper workhorse. ` +
		`Collection from ${county}, near ${flavour.landmark}.`,
	(brand, flavour, county) =>
		`Bought this ${brand} MTB for trail riding around ${county}. Used it maybe a dozen times. ` +
		`Life got in the way -- ${flavour.localRef}. Aluminium frame, front and rear disc brakes. ` +
		`Includes bottle cage and lights.`,
	(brand, flavour, county) =>
		`This ${brand} has survived ${flavour.terrain} and lived to tell the tale. A few scratches from ` +
		`enthusiastic descents near ${flavour.landmark}, but mechanically sound. ` +
		`Recently serviced in ${county}. Tyres, brakes, and gears all good.`
];

const ELECTRIC_DESCRIPTIONS: DescGenerator[] = [
	(brand, flavour, county) =>
		`${brand} e-bike with 250W motor. Takes the hill out of ${flavour.terrain} in ${county}. ` +
		`Battery gets about 50km range on eco mode. Shimano gears, integrated lights. ` +
		`Charger included. ${ucFirst(flavour.localRef)}.`,
	(brand, flavour, county) =>
		`Selling this ${brand} electric because I've moved and don't cycle in ${county} anymore. ` +
		`Brilliant for ${flavour.terrain} -- the motor assist makes even the steep bits manageable. ` +
		`36V battery, pedal assist, LCD display. Lovely machine.`,
	(brand, flavour, county) =>
		`E-bike from ${brand}. Bought it for commuting in ${county} and it was class for that. ` +
		`${ucFirst(flavour.localRef)} -- this bike made every journey easy. ` +
		`Step-through frame, rear rack, mudguards. Battery holds well.`,
	(brand, flavour, county) =>
		`${brand} electric bike in excellent condition. Used around ${flavour.landmark} and ${flavour.terrain}. ` +
		`Three assist levels, throttle mode, removable battery. The ${flavour.demonym}'s secret weapon for hills. ` +
		`Collection from ${county}.`
];

const FOLDING_DESCRIPTIONS: DescGenerator[] = [
	(brand, flavour, county) =>
		`${brand} folding bike -- folds in 20 seconds, fits under a desk or in a car boot. ` +
		`Used for commuting along ${flavour.terrain} in ${county}. Compact but surprisingly comfortable. ` +
		`6-speed Shimano, alloy frame, mudguards.`,
	(brand, flavour, county) =>
		`Selling my ${brand} folder. Ideal for mixed commutes -- cycle to the station, fold, hop on the train. ` +
		`Used it around ${county} for about a year. ${ucFirst(flavour.localRef)}. ` +
		`20-inch wheels, rear rack, front and rear lights included.`,
	(brand, flavour, county) =>
		`${brand} folding bike in good nick. Bought it for trips near ${flavour.landmark} in ${county}. ` +
		`Barely used -- turns out I'm more of a walking person. ` +
		`Quick-fold mechanism, carry bag included. Perfect city bike.`,
	(brand, flavour, county) =>
		`Compact ${brand} folder. Brilliant for storage if you live in a flat or apartment in ${county}. ` +
		`Light aluminium frame, 7 gears, V-brakes. Handles ${flavour.terrain} grand. ` +
		`A ${flavour.demonym} downsizing to one bike.`
];

const BMX_DESCRIPTIONS: DescGenerator[] = [
	(brand, flavour, county) =>
		`${brand} BMX in decent shape. Spent more time at the skatepark than studying, to be fair. ` +
		`Chromoly frame, sealed bearings, good tyres. Perfect for tricks or just messing about. ` +
		`Collection from ${county}.`,
	(brand, flavour, county) =>
		`Selling this ${brand} BMX -- I'm too old for it now. Used around ${flavour.terrain} in ${county}. ` +
		`20-inch wheels, gyro brakes, pegs included. Still goes like a rocket. ` +
		`${ucFirst(flavour.localRef)}.`,
	(brand, flavour, county) =>
		`${brand} BMX. Bought it for messing around near ${flavour.landmark} in ${county}. ` +
		`It's been well used but never abused. Hi-ten steel frame, single speed, rear brake. ` +
		`Would suit a teenager or smaller adult.`,
	(brand, flavour, county) =>
		`Good ${brand} BMX for sale. My young fella has moved on to a mountain bike. ` +
		`Used on paths around ${county} and the odd trip to ${flavour.landmark}. ` +
		`Solid wee bike. A few scuffs but nothing structural.`
];

const KIDS_DESCRIPTIONS: DescGenerator[] = [
	(brand, flavour, county) =>
		`${brand} kids bike. My young one outgrew it in about six months -- they grow fierce fast. ` +
		`Used around ${flavour.terrain} in ${county}. Stabilisers included if needed. ` +
		`Good working order. A great first proper bike.`,
	(brand, flavour, county) =>
		`Selling this ${brand} kids bike. Bought for cycling near ${flavour.landmark} in ${county}. ` +
		`Barely a scratch on it -- the child preferred the PlayStation. ` +
		`Mudguards, chain guard, and bell. Ready to go.`,
	(brand, flavour, county) =>
		`${brand} junior bike from ${county}. Used for school runs and weekend spins along ${flavour.terrain}. ` +
		`${ucFirst(flavour.localRef)} -- plenty of cycling weather ahead. ` +
		`Lightweight frame, easy-grip brakes. Suit ages shown.`,
	(brand, flavour, county) =>
		`Kids ${brand} bike. The ${flavour.demonym}'s child has moved on to bigger things. ` +
		`This bike did great service around ${county} -- trips to the park, school, you name it. ` +
		`Good tyres, working gears, basket on front. Collection near ${flavour.landmark}.`
];

const DESCRIPTION_POOLS: Record<SeedBikeType, DescGenerator[]> = {
	road: ROAD_DESCRIPTIONS,
	mountain: MOUNTAIN_DESCRIPTIONS,
	electric: ELECTRIC_DESCRIPTIONS,
	folding: FOLDING_DESCRIPTIONS,
	bmx: BMX_DESCRIPTIONS,
	kids: KIDS_DESCRIPTIONS
};

// ---------------------------------------------------------------------------
// Content generation
// ---------------------------------------------------------------------------

export type SeedListing = {
	countyId: string;
	countyName: string;
	bikeType: BikeType;
	subtype: BikeSubtype;
	seedBikeType: SeedBikeType;
	title: string;
	description: string;
	price: number;
	currency: 'EUR' | 'GBP';
	condition: BikeCondition;
	sizePreset: BikeSizePreset;
};

export function generateListingContent(
	countyId: string,
	countyName: string,
	bikeType: SeedBikeType,
	flavour: CountyFlavour
): { title: string; description: string } {
	const seed = countyId + ':' + bikeType;
	const brand = seededPick(BRANDS, seed, 0);

	const titleGenerators = TITLE_GENERATORS[bikeType];
	const titleGen = seededPick(titleGenerators, seed, 1);
	const title = titleGen(brand, flavour, countyName);

	const descPool = DESCRIPTION_POOLS[bikeType];
	const descGen = seededPick(descPool, seed, 2);
	const meta = BIKE_TYPE_META[bikeType];
	const condition = seededPick(meta.condition, seed, 3);
	const sizePreset = seededPick(meta.sizePresets, seed, 4);
	const description = descGen(brand, flavour, countyName, condition, sizePreset);

	return { title, description };
}

export function generateAllListings(): SeedListing[] {
	const listings: SeedListing[] = [];
	const countyIds = Object.keys(COUNTY_FLAVOUR);

	for (const countyId of countyIds) {
		const flavour = COUNTY_FLAVOUR[countyId];
		const countyName = countyId.split('/').pop()!;
		const displayName = countyName.charAt(0).toUpperCase() + countyName.slice(1);

		for (const seedType of BIKE_TYPES_TO_SEED) {
			const seed = countyId + ':' + seedType;
			const meta = BIKE_TYPE_META[seedType];

			const { title, description } = generateListingContent(
				countyId,
				displayName,
				seedType,
				flavour
			);

			const price = seededInt(meta.priceRange[0], meta.priceRange[1], seed, 5);
			const condition = seededPick(meta.condition, seed, 3);
			const sizePreset = seededPick(meta.sizePresets, seed, 4);
			const currency = NI_COUNTY_IDS.has(countyId) ? ('GBP' as const) : ('EUR' as const);

			listings.push({
				countyId,
				countyName: displayName,
				bikeType: meta.bikeType,
				subtype: meta.subtype,
				seedBikeType: seedType,
				title,
				description,
				price,
				currency,
				condition,
				sizePreset
			});
		}
	}

	return listings;
}
