import { mockClassifieds } from '../data/mock-ads';

export function load() {
	return {
		ads: mockClassifieds.map((ad) => ad)
	};
}
