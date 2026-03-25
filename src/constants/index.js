import {
  CreditCard, QrCode, Ticket, Globe, BarChart3, Users, LayoutGrid, Package,
  MapPin, Mail, Phone, Clock, Check
} from 'lucide-react'

// ─── NAV ───
export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Demo', href: '#demo' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Contact', href: '#contact' },
]

// ─── FEATURES ───
export const FEATURES = [
  { icon: CreditCard, title: 'Smart POS Billing', description: 'GST-ready billing, split payments, thermal print', color: 'from-[#4F46E5] to-[#818cf8]' },
  { icon: QrCode, title: 'QR-Based Ordering', description: 'Guests scan, order, pay — no staff needed', color: 'from-[#F97316] to-[#fb923c]' },
  { icon: Ticket, title: 'Kitchen Order Tickets', description: 'Live KOT with priority alerts, zero confusion', color: 'from-[#10b981] to-[#34d399]' },
  { icon: Globe, title: 'Website Builder', description: 'Your own branded online menu page, live in minutes', color: 'from-[#8b5cf6] to-[#a78bfa]' },
  { icon: BarChart3, title: 'Real-Time Analytics', description: 'Revenue, top dishes, peak hours — live', color: 'from-[#ec4899] to-[#f472b6]' },
  { icon: Users, title: 'Staff Management', description: 'Roles, shifts, access control per staff', color: 'from-[#0ea5e9] to-[#38bdf8]' },
  { icon: LayoutGrid, title: 'Table Management', description: 'Visual table map, occupancy tracking', color: 'from-[#14b8a6] to-[#2dd4bf]' },
  { icon: Package, title: 'Inventory Alerts', description: 'Stock tracking, low-inventory notifications', color: 'from-[#f43f5e] to-[#fb7185]' },
]

// ─── FEATURE DEEP DIVES ───
export const FEATURE_DEEPDIVES = [
  {
    label: 'POS Billing',
    title: 'Bill in Seconds. Not Minutes.',
    bullets: [
      'GST-compliant invoice in one tap',
      'UPI, card, cash, split payments',
      'Print or WhatsApp bill instantly',
    ],
    visual: 'pos',
  },
  {
    label: 'QR Ordering',
    title: 'Your Menu in Every Guest\'s Hand',
    bullets: [
      'Scan QR → browse → order → pay',
      'Auto-syncs with KOT and POS',
      'Real-time menu editing',
    ],
    visual: 'qr',
  },
  {
    label: 'Kitchen Management',
    title: 'Kitchen Runs Itself',
    bullets: [
      'Live order queue on display',
      'Color-coded: New / Preparing / Ready',
      'Sound alerts, never miss an order',
    ],
    visual: 'kitchen',
  },
  {
    label: 'Analytics',
    title: 'Know What\'s Working. Fix What\'s Not.',
    bullets: [
      'Daily, weekly, monthly revenue',
      'Best-selling and slow-moving dishes',
      'Peak hour heatmap',
    ],
    visual: 'analytics',
  },
]

// ─── HOW IT WORKS ───
export const HOW_IT_WORKS_STEPS = [
  { number: 1, title: 'Setup Your Restaurant', description: 'Add menu, tables, staff. We help you onboard.' },
  { number: 2, title: 'Start Taking Orders', description: 'POS, QR, KOT work together from day one.' },
  { number: 3, title: 'Grow Smarter', description: 'Use analytics to make better decisions every week.' },
]

// ─── DEMO STEPS ───
export const DEMO_STEPS = [
  { id: 0, tab: '1. Scan QR', badge: 'Works on any smartphone', title: 'Guest scans the table QR code', subtitle: 'No app download. No waiting. Just scan.' },
  { id: 1, tab: '2. View Menu', badge: 'Live menu updates', title: 'Instant digital menu loads in seconds', subtitle: 'Menu updates reflect in real-time. Add specials, mark items sold out.' },
  { id: 2, tab: '3. Place Order', badge: 'Instant order confirmation', title: 'Guest adds items and places order', subtitle: 'Payment via UPI, card, or pay at counter. Order confirmed instantly.' },
  { id: 3, tab: '4. Kitchen KOT', badge: 'Zero missed orders', title: 'Kitchen gets the order instantly', subtitle: 'No shouting, no paper tickets, no missed orders. Every order tracked live.' },
]

// ─── PRICING ───
export const PRICING_PLANS = [
  {
    name: 'Starter',
    subtitle: 'For single-outlet restaurants',
    monthly: 2999,
    annual: 2399,
    popular: false,
    features: [
      'POS System (unlimited transactions)',
      'QR-Based Ordering',
      'Kitchen Order Tickets',
      'Basic Analytics (30 days)',
      '1 Staff Account',
      'Email Support',
    ],
  },
  {
    name: 'Growth',
    subtitle: 'For restaurants ready to grow',
    monthly: 5999,
    annual: 4799,
    popular: true,
    features: [
      'Everything in Starter',
      'Restaurant Website Builder',
      'Advanced Analytics (unlimited)',
      'Unlimited Staff Accounts',
      'Inventory Tracking',
      'WhatsApp Bill Sharing',
      'Priority Phone + Chat Support',
      'Multi-device Access',
    ],
  },
]

// ─── TESTIMONIALS ───
export const TESTIMONIALS = [
  {
    stars: 5,
    quote: 'DineDeck completely changed how we manage orders. No more shouting at the kitchen, no more billing mistakes. Everything just works.',
    name: 'Verified Restaurant Owner',
    city: 'Bhubaneswar',
  },
  {
    stars: 5,
    quote: 'The QR ordering is genius. Customers love scanning and ordering themselves. Our staff can now focus on service, not taking orders.',
    name: 'Early Tester',
    city: 'Cuttack',
  },
  {
    stars: 5,
    quote: 'Setup was surprisingly fast. The team helped us go live the same day. The analytics alone is worth the subscription.',
    name: 'Early Tester',
    city: 'Bhubaneswar',
  },
]

// ─── CONTACT ───
export const CONTACT_INFO = {
  email: 'hello@dinedeck.in',
  phone: '+91 XXXXX XXXXX',
  location: 'Bhubaneswar, Odisha, India',
  hours: 'Within 2 hours (Mon–Sat, 9am–8pm)',
}
