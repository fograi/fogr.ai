import Baby from 'lucide-svelte/icons/baby';
import Bike from 'lucide-svelte/icons/bike';
import Folder from 'lucide-svelte/icons/folder';
import Gift from 'lucide-svelte/icons/gift';
import GraduationCap from 'lucide-svelte/icons/graduation-cap';
import Home from 'lucide-svelte/icons/home';
import ImageIcon from 'lucide-svelte/icons/image';
import Link2 from 'lucide-svelte/icons/link-2';
import Monitor from 'lucide-svelte/icons/monitor';
import Flag from 'lucide-svelte/icons/flag';
import Search from 'lucide-svelte/icons/search';
import Share2 from 'lucide-svelte/icons/share-2';
import Shirt from 'lucide-svelte/icons/shirt';
import SlidersHorizontal from 'lucide-svelte/icons/sliders-horizontal';
import ShieldCheck from 'lucide-svelte/icons/shield-check';
import Wrench from 'lucide-svelte/icons/wrench';
import MessageCircle from 'lucide-svelte/icons/message-circle';
import UserRound from 'lucide-svelte/icons/user-round';
import List from 'lucide-svelte/icons/list';
import LogIn from 'lucide-svelte/icons/log-in';
import LogOut from 'lucide-svelte/icons/log-out';

export const CATEGORY_ICON_MAP: Record<string, typeof Folder> = {
	'Home & Garden': Home,
	Electronics: Monitor,
	'Baby & Kids': Baby,
	Bikes: Bike,
	'Clothing & Accessories': Shirt,
	'Services & Gigs': Wrench,
	'Lessons & Tutoring': GraduationCap,
	'Lost and Found': Search,
	'Free / Giveaway': Gift
};

export const DefaultCategoryIcon = Folder;
export const SearchIcon = Search;
export const ImagePlaceholderIcon = ImageIcon;
export const ShareIcon = Share2;
export const ReportIcon = Flag;
export const FilterIcon = SlidersHorizontal;
export const ModerationIcon = ShieldCheck;
export const LinkIcon = Link2;
export const MessagesIcon = MessageCircle;
export const AccountIcon = UserRound;
export const AdsIcon = List;
export const LoginIcon = LogIn;
export const LogoutIcon = LogOut;
