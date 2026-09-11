export interface ServiceCatalogItem {
  serviceCode: string;
  name: string;
  category: string;
  emoji: string | null;
  pricePkr: number;
  costUsd?: number;
  count?: number;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  websiteDomain?: string | null;
}

// ─── Curated Top 100+ Most Popular Services with Verified Corporate Domains ───
export const FALLBACK_SERVICES: ServiceCatalogItem[] = [
  // ── Top Iconic Apps (Page 1 Priorities) ──
  { serviceCode: 'wa', name: 'WhatsApp', category: 'Popular', emoji: '💬', pricePkr: 45, isActive: true, isPopular: true, sortOrder: 1, websiteDomain: 'whatsapp.com' },
  { serviceCode: 'tg', name: 'Telegram', category: 'Popular', emoji: '✈️', pricePkr: 40, isActive: true, isPopular: true, sortOrder: 2, websiteDomain: 'telegram.org' },
  { serviceCode: 'go', name: 'Google / Gmail / YouTube', category: 'Popular', emoji: '🔍', pricePkr: 50, isActive: true, isPopular: true, sortOrder: 3, websiteDomain: 'google.com' },
  { serviceCode: 'fb', name: 'Facebook', category: 'Popular', emoji: '📘', pricePkr: 30, isActive: true, isPopular: true, sortOrder: 4, websiteDomain: 'facebook.com' },
  { serviceCode: 'ig', name: 'Instagram', category: 'Popular', emoji: '📸', pricePkr: 35, isActive: true, isPopular: true, sortOrder: 5, websiteDomain: 'instagram.com' },
  { serviceCode: 'lf', name: 'TikTok', category: 'Popular', emoji: '🎵', pricePkr: 35, isActive: true, isPopular: true, sortOrder: 6, websiteDomain: 'tiktok.com' },
  { serviceCode: 'tt', name: 'Pinterest', category: 'Social', emoji: '📌', pricePkr: 35, isActive: true, isPopular: true, sortOrder: 6, websiteDomain: 'pinterest.com' },
  { serviceCode: 'dr', name: 'OpenAI / ChatGPT', category: 'Popular', emoji: '🤖', pricePkr: 60, isActive: true, isPopular: true, sortOrder: 7, websiteDomain: 'openai.com' },
  { serviceCode: 'tw', name: 'Twitter / X', category: 'Popular', emoji: '🐦', pricePkr: 40, isActive: true, isPopular: true, sortOrder: 8, websiteDomain: 'x.com' },
  { serviceCode: 'wx', name: 'Apple / iCloud', category: 'Tech', emoji: '🍎', pricePkr: 60, isActive: true, isPopular: true, sortOrder: 9, websiteDomain: 'apple.com' },
  { serviceCode: 'mm', name: 'Microsoft / Outlook', category: 'Tech', emoji: '🪟', pricePkr: 45, isActive: true, isPopular: true, sortOrder: 10, websiteDomain: 'microsoft.com' },
  { serviceCode: 'mt', name: 'Steam', category: 'Entertainment', emoji: '🎮', pricePkr: 40, isActive: true, isPopular: true, sortOrder: 11, websiteDomain: 'steampowered.com' },
  { serviceCode: 'sn', name: 'OLX', category: 'Shopping', emoji: '🛒', pricePkr: 35, isActive: true, isPopular: true, sortOrder: 12, websiteDomain: 'olx.com' },
  { serviceCode: 'fu', name: 'Snapchat', category: 'Social', emoji: '👻', pricePkr: 35, isActive: true, isPopular: true, sortOrder: 13, websiteDomain: 'snapchat.com' },
  { serviceCode: 'ds', name: 'Discord', category: 'Social', emoji: '🎮', pricePkr: 40, isActive: true, isPopular: true, sortOrder: 14, websiteDomain: 'discord.com' },
  { serviceCode: 'ts', name: 'PayPal', category: 'Finance', emoji: '💳', pricePkr: 60, isActive: true, isPopular: true, sortOrder: 15, websiteDomain: 'paypal.com' },
  { serviceCode: 'am', name: 'Amazon', category: 'Shopping', emoji: '📦', pricePkr: 60, isActive: true, isPopular: true, sortOrder: 16, websiteDomain: 'amazon.com' },
  { serviceCode: 'wr', name: 'Walmart', category: 'Shopping', emoji: '🛒', pricePkr: 60, isActive: true, isPopular: true, sortOrder: 17, websiteDomain: 'walmart.com' },
  { serviceCode: 'vi', name: 'Viber', category: 'Social', emoji: '💜', pricePkr: 35, isActive: true, isPopular: true, sortOrder: 18, websiteDomain: 'viber.com' },
  { serviceCode: 'nf', name: 'Netflix', category: 'Entertainment', emoji: '🎬', pricePkr: 50, isActive: true, isPopular: true, sortOrder: 19, websiteDomain: 'netflix.com' },
  { serviceCode: 'sp', name: 'Spotify', category: 'Entertainment', emoji: '🎧', pricePkr: 40, isActive: true, isPopular: true, sortOrder: 20, websiteDomain: 'spotify.com' },
  { serviceCode: 'alj', name: 'SoundCloud', category: 'Entertainment', emoji: '☁️', pricePkr: 40, isActive: true, isPopular: true, sortOrder: 20, websiteDomain: 'soundcloud.com' },
  { serviceCode: 'ub', name: 'Uber / UberEats', category: 'Shopping', emoji: '🚗', pricePkr: 45, isActive: true, isPopular: true, sortOrder: 21, websiteDomain: 'uber.com' },
  { serviceCode: 'tn', name: 'LinkedIn', category: 'Social', emoji: '💼', pricePkr: 50, isActive: true, isPopular: true, sortOrder: 22, websiteDomain: 'linkedin.com' },
  { serviceCode: 'rd', name: 'Reddit', category: 'Social', emoji: '🤖', pricePkr: 35, isActive: true, isPopular: true, sortOrder: 23, websiteDomain: 'reddit.com' },
  { serviceCode: 'oi', name: 'Tinder', category: 'Social', emoji: '🔥', pricePkr: 50, isActive: true, isPopular: true, sortOrder: 24, websiteDomain: 'tinder.com' },
  { serviceCode: 'ba', name: 'Binance', category: 'Finance', emoji: '🪙', pricePkr: 70, isActive: true, isPopular: true, sortOrder: 25, websiteDomain: 'binance.com' },
  { serviceCode: 'cb', name: 'Coinbase', category: 'Finance', emoji: '🪙', pricePkr: 70, isActive: true, isPopular: true, sortOrder: 26, websiteDomain: 'coinbase.com' },
  { serviceCode: 're', name: 'Revolut', category: 'Finance', emoji: '💳', pricePkr: 70, isActive: true, isPopular: true, sortOrder: 27, websiteDomain: 'revolut.com' },
  { serviceCode: 'ws', name: 'Wise', category: 'Finance', emoji: '💳', pricePkr: 60, isActive: true, isPopular: true, sortOrder: 28, websiteDomain: 'wise.com' },

  // ── Social, Messaging & Dating ──
  { serviceCode: 'mo', name: 'Bumble', category: 'Social', emoji: '🐝', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 30, websiteDomain: 'bumble.com' },
  { serviceCode: 'qv', name: 'Badoo', category: 'Social', emoji: '💜', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 31, websiteDomain: 'badoo.com' },
  { serviceCode: 'vz', name: 'Hinge', category: 'Social', emoji: '🖤', pricePkr: 50, isActive: true, isPopular: false, sortOrder: 32, websiteDomain: 'hinge.co' },
  { serviceCode: 'vm', name: 'OkCupid', category: 'Social', emoji: '💘', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 33, websiteDomain: 'okcupid.com' },
  { serviceCode: 'yw', name: 'Grindr', category: 'Social', emoji: '💛', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 34, websiteDomain: 'grindr.com' },
  { serviceCode: 'wg', name: 'Skout', category: 'Social', emoji: '👥', pricePkr: 35, isActive: true, isPopular: false, sortOrder: 35, websiteDomain: 'skout.com' },
  { serviceCode: 'ama', name: 'WooPlus', category: 'Social', emoji: '❤️', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 36, websiteDomain: 'wooplus.com' },
  { serviceCode: 'axr', name: 'Match', category: 'Social', emoji: '💖', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 37, websiteDomain: 'match.com' },
  { serviceCode: 'pf', name: 'Plenty of Fish (POF)', category: 'Social', emoji: '🐟', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 38, websiteDomain: 'pof.com' },
  { serviceCode: 'me', name: 'LINE', category: 'Social', emoji: '💚', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 39, websiteDomain: 'line.me' },
  { serviceCode: 'wb', name: 'WeChat', category: 'Social', emoji: '💬', pricePkr: 50, isActive: true, isPopular: false, sortOrder: 40, websiteDomain: 'wechat.com' },
  { serviceCode: 'rc', name: 'Skype', category: 'Social', emoji: '📞', pricePkr: 35, isActive: true, isPopular: false, sortOrder: 41, websiteDomain: 'skype.com' },
  { serviceCode: 'kt', name: 'KakaoTalk', category: 'Social', emoji: '🟡', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 42, websiteDomain: 'kakaocorp.com' },
  { serviceCode: 'im', name: 'IMO', category: 'Social', emoji: '🔹', pricePkr: 35, isActive: true, isPopular: false, sortOrder: 43, websiteDomain: 'imo.im' },
  { serviceCode: 'et', name: 'Clubhouse', category: 'Social', emoji: '👋', pricePkr: 35, isActive: true, isPopular: false, sortOrder: 44, websiteDomain: 'clubhouse.com' },
  { serviceCode: 'bl', name: 'Bigo Live', category: 'Social', emoji: '📹', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 45, websiteDomain: 'bigo.tv' },
  { serviceCode: 'vk', name: 'VKontakte', category: 'Social', emoji: '🔷', pricePkr: 35, isActive: true, isPopular: false, sortOrder: 46, websiteDomain: 'vk.com' },
  { serviceCode: 'kf', name: 'Weibo', category: 'Social', emoji: '👁️', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 47, websiteDomain: 'weibo.com' },
  { serviceCode: 'ok', name: 'OK.ru', category: 'Social', emoji: '🟠', pricePkr: 35, isActive: true, isPopular: false, sortOrder: 48, websiteDomain: 'ok.ru' },
  { serviceCode: 'fd', name: 'Mamba', category: 'Social', emoji: '💖', pricePkr: 35, isActive: true, isPopular: false, sortOrder: 49, websiteDomain: 'mamba.ru' },
  { serviceCode: 'qq', name: 'QQ', category: 'Social', emoji: '🐧', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 50, websiteDomain: 'qq.com' },
  { serviceCode: 'ef', name: 'Nextdoor', category: 'Social', emoji: '🏡', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 51, websiteDomain: 'nextdoor.com' },

  // ── Tech, AI, Cloud & Communication ──
  { serviceCode: 'acz', name: 'Claude / Anthropic', category: 'Tech', emoji: '🧠', pricePkr: 60, isActive: true, isPopular: false, sortOrder: 52, websiteDomain: 'anthropic.com' },
  { serviceCode: 'gf', name: 'Google Voice', category: 'Tech', emoji: '📞', pricePkr: 60, isActive: true, isPopular: false, sortOrder: 53, websiteDomain: 'voice.google.com' },
  { serviceCode: 'git', name: 'GitHub', category: 'Tech', emoji: '🐙', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 54, websiteDomain: 'github.com' },
  { serviceCode: 'dp', name: 'ProtonMail', category: 'Tech', emoji: '🔒', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 55, websiteDomain: 'proton.me' },
  { serviceCode: 'mb', name: 'Yahoo Mail', category: 'Tech', emoji: '📧', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 56, websiteDomain: 'yahoo.com' },
  { serviceCode: 'ya', name: 'Yandex', category: 'Tech', emoji: '🔴', pricePkr: 35, isActive: true, isPopular: false, sortOrder: 57, websiteDomain: 'yandex.com' },
  { serviceCode: 'li', name: 'Baidu', category: 'Tech', emoji: '🐾', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 58, websiteDomain: 'baidu.com' },
  { serviceCode: 'ma', name: 'Mail.ru', category: 'Tech', emoji: '✉️', pricePkr: 35, isActive: true, isPopular: false, sortOrder: 59, websiteDomain: 'mail.ru' },
  { serviceCode: 'tc', name: 'Rambler', category: 'Tech', emoji: '🌐', pricePkr: 35, isActive: true, isPopular: false, sortOrder: 60, websiteDomain: 'rambler.ru' },
  { serviceCode: 'pm', name: 'AOL', category: 'Tech', emoji: '📬', pricePkr: 35, isActive: true, isPopular: false, sortOrder: 61, websiteDomain: 'aol.com' },
  { serviceCode: 'ayz', name: 'Moonshot AI', category: 'Tech', emoji: '🌙', pricePkr: 50, isActive: true, isPopular: false, sortOrder: 62, websiteDomain: 'moonshot.cn' },
  { serviceCode: 'aiz', name: 'Brevo', category: 'Tech', emoji: '📨', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 63, websiteDomain: 'brevo.com' },
  { serviceCode: 'gs', name: 'Samsung', category: 'Tech', emoji: '📱', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 64, websiteDomain: 'samsung.com' },
  { serviceCode: 'zoom', name: 'Zoom', category: 'Tech', emoji: '📹', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 65, websiteDomain: 'zoom.us' },
  { serviceCode: 'slack', name: 'Slack', category: 'Tech', emoji: '💬', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 66, websiteDomain: 'slack.com' },

  // ── E-Commerce, Shopping & Classifieds ──
  { serviceCode: 'dh', name: 'eBay', category: 'Shopping', emoji: '🛍️', pricePkr: 50, isActive: true, isPopular: false, sortOrder: 67, websiteDomain: 'ebay.com' },
  { serviceCode: 'ali', name: 'AliExpress', category: 'Shopping', emoji: '🏷️', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 68, websiteDomain: 'aliexpress.com' },
  { serviceCode: 'hx', name: 'SHEIN', category: 'Shopping', emoji: '👗', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 68, websiteDomain: 'shein.com' },
  { serviceCode: 'ep', name: 'Temu', category: 'Shopping', emoji: '🎁', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 69, websiteDomain: 'temu.com' },
  { serviceCode: 'ka', name: 'Shopee', category: 'Shopping', emoji: '🟠', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 70, websiteDomain: 'shopee.com' },
  { serviceCode: 'kc', name: 'Vinted', category: 'Shopping', emoji: '👗', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 71, websiteDomain: 'vinted.com' },
  { serviceCode: 'oz', name: 'Poshmark', category: 'Shopping', emoji: '👠', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 72, websiteDomain: 'poshmark.com' },
  { serviceCode: 'dg', name: 'Mercari', category: 'Shopping', emoji: '📦', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 73, websiteDomain: 'mercari.com' },
  { serviceCode: 'zm', name: 'OfferUp', category: 'Shopping', emoji: '🏷️', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 74, websiteDomain: 'offerup.com' },
  { serviceCode: 'wc', name: 'Craigslist', category: 'Shopping', emoji: '📰', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 75, websiteDomain: 'craigslist.org' },
  { serviceCode: 'bex', name: 'Whatnot', category: 'Shopping', emoji: '📺', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 76, websiteDomain: 'whatnot.com' },
  { serviceCode: 'ew', name: 'Nike', category: 'Shopping', emoji: '👟', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 77, websiteDomain: 'nike.com' },
  { serviceCode: 'target', name: 'Target', category: 'Shopping', emoji: '🎯', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 78, websiteDomain: 'target.com' },
  { serviceCode: 'ikea', name: 'IKEA', category: 'Shopping', emoji: '🛋️', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 79, websiteDomain: 'ikea.com' },
  { serviceCode: 'zara', name: 'Zara', category: 'Shopping', emoji: '👗', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 80, websiteDomain: 'zara.com' },
  { serviceCode: 'etsy', name: 'Etsy', category: 'Shopping', emoji: '🎨', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 81, websiteDomain: 'etsy.com' },
  { serviceCode: 'shopify', name: 'Shopify', category: 'Shopping', emoji: '🛍️', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 82, websiteDomain: 'shopify.com' },
  { serviceCode: 'sg', name: 'Ozon', category: 'Shopping', emoji: '🔵', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 83, websiteDomain: 'ozon.ru' },
  { serviceCode: 'uu', name: 'Wildberries', category: 'Shopping', emoji: '🟣', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 84, websiteDomain: 'wildberries.ru' },

  // ── Food, Delivery, Rides & Travel ──
  { serviceCode: 'tu', name: 'Lyft', category: 'Shopping', emoji: '🚗', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 85, websiteDomain: 'lyft.com' },
  { serviceCode: 'ac', name: 'DoorDash', category: 'Shopping', emoji: '🍔', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 86, websiteDomain: 'doordash.com' },
  { serviceCode: 'nz', name: 'Foodpanda', category: 'Shopping', emoji: '🐼', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 87, websiteDomain: 'foodpanda.com' },
  { serviceCode: 'deliveroo', name: 'Deliveroo', category: 'Shopping', emoji: '🦘', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 88, websiteDomain: 'deliveroo.com' },
  { serviceCode: 'tx', name: 'Bolt', category: 'Shopping', emoji: '⚡', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 89, websiteDomain: 'bolt.eu' },
  { serviceCode: 'jg', name: 'Grab', category: 'Shopping', emoji: '🟢', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 90, websiteDomain: 'grab.com' },
  { serviceCode: 'rr', name: 'Wolt', category: 'Shopping', emoji: '🍕', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 91, websiteDomain: 'wolt.com' },
  { serviceCode: 'ul', name: 'Getir', category: 'Shopping', emoji: '🛵', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 92, websiteDomain: 'getir.com' },
  { serviceCode: 'aba', name: 'Rappi', category: 'Shopping', emoji: '🎒', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 93, websiteDomain: 'rappi.com' },
  { serviceCode: 'abe', name: 'Foodora', category: 'Shopping', emoji: '🍱', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 94, websiteDomain: 'foodora.com' },
  { serviceCode: 'yi', name: 'Yemeksepeti', category: 'Shopping', emoji: '🍲', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 95, websiteDomain: 'yemeksepeti.com' },
  { serviceCode: 'ry', name: "McDonald's", category: 'Shopping', emoji: '🍟', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 96, websiteDomain: 'mcdonalds.com' },
  { serviceCode: 'kfc', name: 'KFC', category: 'Shopping', emoji: '🍗', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 97, websiteDomain: 'kfc.com' },
  { serviceCode: 'starbucks', name: 'Starbucks', category: 'Shopping', emoji: '☕', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 98, websiteDomain: 'starbucks.com' },
  { serviceCode: 'burgerking', name: 'Burger King', category: 'Shopping', emoji: '🍔', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 99, websiteDomain: 'burgerking.com' },
  { serviceCode: 'ua', name: 'BlaBlaCar', category: 'Shopping', emoji: '🚙', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 100, websiteDomain: 'blablacar.com' },
  { serviceCode: 'uk', name: 'Airbnb', category: 'Shopping', emoji: '🏡', pricePkr: 50, isActive: true, isPopular: false, sortOrder: 101, websiteDomain: 'airbnb.com' },
  { serviceCode: 'booking', name: 'Booking.com', category: 'Shopping', emoji: '🏨', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 102, websiteDomain: 'booking.com' },
  { serviceCode: 'tripadvisor', name: 'TripAdvisor', category: 'Shopping', emoji: '🦉', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 103, websiteDomain: 'tripadvisor.com' },
  { serviceCode: 'expedia', name: 'Expedia', category: 'Shopping', emoji: '✈️', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 104, websiteDomain: 'expedia.com' },

  // ── Finance, Crypto & Banking ──
  { serviceCode: 'bybit', name: 'Bybit', category: 'Finance', emoji: '🪙', pricePkr: 60, isActive: true, isPopular: false, sortOrder: 105, websiteDomain: 'bybit.com' },
  { serviceCode: 'stripe', name: 'Stripe', category: 'Finance', emoji: '💳', pricePkr: 60, isActive: true, isPopular: false, sortOrder: 106, websiteDomain: 'stripe.com' },
  { serviceCode: 'klarna', name: 'Klarna', category: 'Finance', emoji: '🛍️', pricePkr: 50, isActive: true, isPopular: false, sortOrder: 107, websiteDomain: 'klarna.com' },
  { serviceCode: 'zr', name: 'Papara', category: 'Finance', emoji: '💳', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 108, websiteDomain: 'papara.com' },
  { serviceCode: 'bp', name: 'GoFundMe', category: 'Finance', emoji: '🤝', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 109, websiteDomain: 'gofundme.com' },
  { serviceCode: 'bd', name: 'X5 Group', category: 'Finance', emoji: '🏬', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 110, websiteDomain: 'x5.ru' },

  // ── Entertainment & Gaming ──
  { serviceCode: 'hb', name: 'Twitch', category: 'Entertainment', emoji: '💜', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 111, websiteDomain: 'twitch.tv' },
  { serviceCode: 'bz', name: 'Blizzard Battle.net', category: 'Entertainment', emoji: '❄️', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 112, websiteDomain: 'blizzard.com' },
  { serviceCode: 'ahb', name: 'Ubisoft', category: 'Entertainment', emoji: '🌀', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 113, websiteDomain: 'ubisoft.com' },
  { serviceCode: 'playstation', name: 'PlayStation Network', category: 'Entertainment', emoji: '🎮', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 114, websiteDomain: 'playstation.com' },
  { serviceCode: 'epicgames', name: 'Epic Games', category: 'Entertainment', emoji: '🕹️', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 115, websiteDomain: 'epicgames.com' },
  { serviceCode: 'riotgames', name: 'Riot Games', category: 'Entertainment', emoji: '👊', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 116, websiteDomain: 'riotgames.com' },
  { serviceCode: 'ea', name: 'Electronic Arts (EA)', category: 'Entertainment', emoji: '⚽', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 117, websiteDomain: 'ea.com' },
  { serviceCode: 'oe', name: 'Codashop', category: 'Entertainment', emoji: '💎', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 118, websiteDomain: 'codashop.com' },
  { serviceCode: 'vp', name: 'Kwai', category: 'Entertainment', emoji: '📹', pricePkr: 35, isActive: true, isPopular: false, sortOrder: 119, websiteDomain: 'kwai.com' },
  { serviceCode: 'alg', name: 'Ankama', category: 'Entertainment', emoji: '⚔️', pricePkr: 35, isActive: true, isPopular: false, sortOrder: 120, websiteDomain: 'ankama.com' },
  { serviceCode: 'yl', name: 'Yalla Live', category: 'Entertainment', emoji: '🎙️', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 121, websiteDomain: 'yalla.live' },
  { serviceCode: 'zy', name: 'NTTGame', category: 'Entertainment', emoji: '🎮', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 122, websiteDomain: 'nttgame.com' },

  // ── Work, Education & Utilities ──
  { serviceCode: 'cn', name: 'Fiverr', category: 'Social', emoji: '💼', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 123, websiteDomain: 'fiverr.com' },
  { serviceCode: 'gq', name: 'Freelancer', category: 'Social', emoji: '💻', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 124, websiteDomain: 'freelancer.com' },
  { serviceCode: 'upwork', name: 'Upwork', category: 'Social', emoji: '💼', pricePkr: 50, isActive: true, isPopular: false, sortOrder: 125, websiteDomain: 'upwork.com' },
  { serviceCode: 'coursera', name: 'Coursera', category: 'Tech', emoji: '🎓', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 126, websiteDomain: 'coursera.org' },
  { serviceCode: 'udemy', name: 'Udemy', category: 'Tech', emoji: '📚', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 127, websiteDomain: 'udemy.com' },
  { serviceCode: 'duolingo', name: 'Duolingo', category: 'Tech', emoji: '🦉', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 128, websiteDomain: 'duolingo.com' },
  { serviceCode: 'medium', name: 'Medium', category: 'Social', emoji: '📝', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 129, websiteDomain: 'medium.com' },
  { serviceCode: 'app', name: 'ClassPass', category: 'Shopping', emoji: '🏋️', pricePkr: 45, isActive: true, isPopular: false, sortOrder: 130, websiteDomain: 'classpass.com' },
  { serviceCode: 'qf', name: 'Xiaohongshu', category: 'Social', emoji: '📕', pricePkr: 40, isActive: true, isPopular: false, sortOrder: 131, websiteDomain: 'xiaohongshu.com' },
  { serviceCode: 'fs', name: 'Sikayetvar', category: 'Social', emoji: '📣', pricePkr: 35, isActive: true, isPopular: false, sortOrder: 132, websiteDomain: 'sikayetvar.com' },

  // ── Universal Catch-All ──
  { serviceCode: 'ot', name: 'Any Other Service', category: 'Others', emoji: '📱', pricePkr: 60, isActive: true, isPopular: false, sortOrder: 999, websiteDomain: null },
];

/** Fast lookup set of approved popular service codes */
export const APPROVED_POPULAR_CODES = new Set<string>(
  FALLBACK_SERVICES.map((s) => s.serviceCode.toLowerCase())
);

/**
 * Returns true only if the service belongs to the approved popular apps list
 */
export function isApprovedPopularService(serviceCode: string, name?: string): boolean {
  if (!serviceCode) return false;
  const code = serviceCode.toLowerCase().trim();
  if (APPROVED_POPULAR_CODES.has(code) || code === 'ot') return true;

  if (name) {
    const n = name.toLowerCase().trim();
    return FALLBACK_SERVICES.some((s) => s.name.toLowerCase() === n);
  }
  return false;
}

export const SERVICE_CATEGORIES = [
  'All',
  'Popular',
  'Social',
  'Tech',
  'Shopping',
  'Finance',
  'Entertainment',
  'Others',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export function getServiceHref(serviceCode: string): string {
  return `/numbers?service=${encodeURIComponent(serviceCode.toLowerCase())}`;
}

export function findFallbackService(code: string): ServiceCatalogItem | undefined {
  const c = code.toLowerCase().trim();
  return (
    FALLBACK_SERVICES.find((s) => s.serviceCode.toLowerCase() === c) ||
    FALLBACK_SERVICES.find((s) => s.name.toLowerCase().includes(c))
  );
}
