export const hasPaidPrice = (price: number | null | undefined) =>
	typeof price === 'number' && price > 0;
