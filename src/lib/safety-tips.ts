export const QUICK_SAFETY_TIPS = [
	'Meet in a busy, public place during daylight',
	'Cash on collection is safest -- avoid bank transfers to strangers',
	"Never pay in advance for items you haven't seen",
	'If a deal seems too good to be true, it probably is'
] as const;

export const FULL_SAFETY_SECTIONS = [
	{
		title: 'Meeting the seller or buyer',
		tips: [
			'Always meet in a busy, public place during daylight hours',
			"Bring a friend or let someone know where you're going",
			'For valuable items, consider meeting at a Garda station',
			'Never invite strangers to your home or go to theirs alone'
		]
	},
	{
		title: 'Payment safety',
		tips: [
			'Cash on collection is the safest option',
			'Never send money by bank transfer before receiving the item',
			'Be wary of requests to pay via gift cards, cryptocurrency, or wire transfer',
			'For high-value items, consider using PayPal Goods & Services for buyer protection'
		]
	},
	{
		title: 'Spotting scams',
		tips: [
			'If a price seems too good to be true, it probably is',
			'Be suspicious of sellers who refuse to meet in person',
			'Watch out for pressure to act quickly or "other buyers waiting"',
			'Verify the item exists -- ask for specific photos or video',
			'Be cautious of listings with stock photos instead of real photos'
		]
	},
	{
		title: 'Protecting your information',
		tips: [
			'Use the in-app messaging system rather than sharing your phone number',
			"Don't share personal details like your home address until you're confident",
			'Be cautious of phishing links in messages'
		]
	}
] as const;
