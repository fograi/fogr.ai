// NI county to GBP default currency mapping
// The 6 Northern Ireland counties default to GBP; everything else defaults to EUR.
// The 3 ROI Ulster counties (Cavan, Donegal, Monaghan) correctly default to EUR.

/**
 * The 6 Northern Ireland county IDs from ireland_counties.json.
 * These counties use GBP as their default currency.
 */
export const NI_COUNTY_IDS = new Set([
	'ie/ulster/antrim',
	'ie/ulster/armagh',
	'ie/ulster/down',
	'ie/ulster/fermanagh',
	'ie/ulster/derry',
	'ie/ulster/tyrone'
]);

/**
 * Returns the default currency for a given county.
 * GBP for the 6 NI counties, EUR for everything else (including ROI Ulster counties).
 */
export function getDefaultCurrency(countyId: string | null): 'EUR' | 'GBP' {
	if (!countyId) return 'EUR';
	return NI_COUNTY_IDS.has(countyId) ? 'GBP' : 'EUR';
}
