import {
	Baby,
	Bike,
	Folder,
	Gift,
	GraduationCap,
	Home,
	Image as ImageIcon,
	Monitor,
	Search,
	Shirt,
	Wrench
} from 'lucide-svelte';

export const CATEGORY_ICON_MAP: Record<string, typeof Folder> = {
	'Home & Garden': Home,
	Electronics: Monitor,
	'Baby & Kids': Baby,
	'Sports & Bikes': Bike,
	'Clothing & Accessories': Shirt,
	'Services & Gigs': Wrench,
	'Lessons & Tutoring': GraduationCap,
	'Lost and Found': Search,
	'Free / Giveaway': Gift
};

export const DefaultCategoryIcon = Folder;
export const SearchIcon = Search;
export const ImagePlaceholderIcon = ImageIcon;
