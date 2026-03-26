import {
  CreditCard, QrCode, Ticket, Globe, BarChart3, Users, LayoutGrid, Package,
  MapPin, Mail, Phone, Clock, Check, TrendingUp, Sparkles, Smartphone, Monitor
} from 'lucide-react'

// ─── NAV ───
export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Demo', href: '#demo' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Contact', href: '#contact' },
]

// ─── FEATURES GRID OVERHAUL (CHANGE 3) ───
export const FEATURES = [
  { 
    id: 'pos',
    icon: CreditCard, 
    title: 'Smart POS Billing', 
    description: 'Bill faster, make zero errors, and track every rupee.',
    color: 'from-indigo-600 to-indigo-400',
    expansion: {
      headline: 'Stop losing money to billing mistakes',
      problem: 'Most restaurants lose ₹3,000–₹8,000/month to billing errors, wrong GST calculations, and slow checkout. Your staff is human — they make mistakes.',
      solution: 'DineDeck POS handles every calculation automatically. GST, discounts, split bills — done in seconds, not minutes.',
      stats: 'Average billing time reduced from 4 minutes to 47 seconds',
      cta: 'See POS in Action',
      target: '#demo'
    }
  },
  { 
    id: 'qr',
    icon: QrCode, 
    title: 'QR-Based Ordering', 
    description: 'Let guests order themselves and skip the wait.',
    color: 'from-orange-500 to-orange-400',
    expansion: {
      headline: 'Your busiest nights, handled without extra staff',
      problem: 'During peak hours, 1 waiter handles 6 tables. Orders get mixed up. Customers wait. They leave unhappy and don\'t come back.',
      solution: 'With DineDeck QR ordering, guests browse your full menu, customize their order, and send it directly to the kitchen — without involving your staff.',
      stats: 'Restaurants using QR ordering serve 30% more tables in the same time',
      cta: 'Watch the QR Demo',
      target: '#demo'
    }
  },
  { 
    id: 'kot',
    icon: Ticket, 
    title: 'Kitchen Order Tickets', 
    description: 'Zero missed orders with live kitchen display.',
    color: 'from-emerald-500 to-emerald-400',
    expansion: {
      headline: 'No more "what was that order?" moments',
      problem: 'Verbal orders get forgotten. Handwritten tickets get lost or misread. One missed order can ruin a customer\'s entire experience.',
      solution: 'Every order from POS or QR goes directly to the kitchen screen. Color-coded, prioritized, and impossible to miss.',
      stats: '98% reduction in wrong or missed orders',
      cta: 'See How KOT Works',
      target: '#demo'
    }
  },
  { 
    id: 'web',
    icon: Globe, 
    title: 'Website Builder', 
    description: 'Get your restaurant online in under 30 minutes.',
    color: 'from-violet-600 to-violet-400',
    expansion: {
      headline: 'Get online before your competitor does',
      problem: 'Your restaurant doesn\'t show up when someone Googles "restaurants in [your city]". You\'re invisible to an entire generation of customers who decide where to eat online.',
      solution: 'DineDeck gives you a beautiful, mobile-optimized restaurant website with your full menu, photos, and an online ordering option — live in under 30 minutes.',
      stats: 'Restaurants with online presence get 2.4x more new customers per month',
      cta: 'Get Your Restaurant Online',
      target: '#contact'
    }
  },
  { 
    id: 'analytics',
    icon: BarChart3, 
    title: 'Real-Time Analytics', 
    description: 'Know which dish makes you the most money.',
    color: 'from-pink-500 to-pink-400',
    expansion: {
      headline: 'Run your restaurant on data, not gut feeling',
      problem: 'You know your restaurant is busy on weekends — but do you know WHICH dishes make you the most profit? Which table has the best turnover? What time your revenue drops?',
      solution: 'DineDeck shows you everything: daily revenue, top 10 dishes, peak hours heatmap, average order value, and weekly trends — all in one screen.',
      stats: 'Restaurants using analytics grow revenue 23% faster in the first 3 months',
      cta: 'See Your Dashboard',
      target: '#demo'
    }
  },
  { 
    id: 'staff',
    icon: Users, 
    title: 'Staff Management', 
    description: 'Control who sees what, even when you aren\'t there.',
    color: 'from-sky-500 to-sky-400',
    expansion: {
      headline: 'Know your team is doing their job — without watching them',
      problem: 'You can\'t be in the restaurant 24/7. Staff take shortcuts when you\'re not watching. Orders get delayed. Customers get ignored.',
      solution: 'Set roles, permissions, and access levels for every staff member. See who handled which order, track shift timings, and control what each person can see or edit.',
      stats: 'Owners report 40% less staff conflict after implementing role-based access',
      cta: 'See Staff Features',
      target: '#contact'
    }
  },
  { 
    id: 'tables',
    icon: LayoutGrid, 
    title: 'Table Management', 
    description: 'Live visual map of every table in your restaurant.',
    color: 'from-teal-500 to-teal-400',
    expansion: {
      headline: 'Stop guessing which tables are free',
      problem: 'During a rush, your staff doesn\'t know which tables are occupied, billed, or waiting for food. Customers stand at the entrance while empty tables sit unnoticed.',
      solution: 'Live visual table map shows every table\'s status in real-time: Free, Occupied, Bill Requested, or Reserved. One glance tells your staff everything.',
      stats: '25% faster table turnover in the first week',
      cta: 'See Table Management',
      target: '#demo'
    }
  },
  { 
    id: 'inventory',
    icon: Package, 
    title: 'Inventory Tracking', 
    description: 'Never run out of a dish mid-service again.',
    color: 'from-rose-500 to-rose-400',
    expansion: {
      headline: 'Never 86 a dish mid-service again',
      problem: 'Running out of key ingredients mid-service is embarrassing and costly. Customers order a dish, you have to turn them away. They don\'t forget it.',
      solution: 'Track ingredient levels in real-time. Get low-stock alerts before service starts. Know exactly when to reorder and how much — automatically.',
      stats: 'Average food waste reduced by 18% in the first month',
      cta: 'See Inventory Features',
      target: '#contact'
    }
  },
]

// ─── PRICING OVERHAUL (CHANGE 1) ───
export const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 1999,
    tagline: 'Everything you need to go digital today',
    bestFor: 'Single-outlet restaurants just starting out',
    features: [
      'Smart POS — Bill faster, make zero errors',
      'QR Ordering — Let guests order themselves',
      'Kitchen Order Tickets — Zero missed orders',
      'Digital Menu — Always up to date, zero printing cost',
      'Basic Analytics — See today\'s revenue and top dishes',
      '2 Staff Accounts — Owner + 1 manager',
      'WhatsApp bill sharing — Professional receipts instantly',
      'Email support — Response within 24 hours',
      '14-day free trial included',
    ],
    cta: 'Start Free — No Card Needed',
    note: 'Setup done by our team. You just show up.',
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 4999,
    tagline: 'For restaurants ready to grow beyond walk-ins',
    bestFor: 'Restaurants wanting online presence + deeper control',
    features: [
      'Everything in Starter, plus:',
      'Your own restaurant website — Take online orders directly',
      'Advanced Analytics — Know which dish makes you money',
      'Inventory Tracking — Never run out of a dish again',
      'Unlimited Staff Accounts — Full team, full control',
      'Staff Roles & Permissions — Control who sees what',
      'Table Management — Visual map, live occupancy',
      'Priority WhatsApp Support — Real human, under 2 hours',
      'Monthly Growth Review Call — We look at your numbers',
      'Early access to new features — Always first',
    ],
    cta: 'Start Free — No Card Needed',
    note: 'Includes everything in Starter. Upgrade or cancel anytime.',
    popular: true,
  },
]

// ─── OUR STORY JOURNEY (CHANGE 5) ───
export const JOURNEY_ITEMS = [
  { date: 'Dec 2024', text: 'DineDeck founded in Bhubaneswar, Odisha', type: 'completed' },
  { date: 'Jan 2025', text: 'First restaurant onboarded. First order placed. First lesson learned.', type: 'completed' },
  { date: 'Mar 2025', text: 'Live in Bhubaneswar & Cuttack', type: 'completed' },
  { date: '2025 (ongoing)', text: 'Building with our first partner restaurant, refining every feature', type: 'active' },
  { date: 'Coming Soon', text: 'Expanding to 10 restaurants across Odisha', type: 'future' },
]

export const TESTIMONIALS = [
  {
    stars: 5,
    quote: 'Being DineDeck\'s first restaurant was the best decision we made. The QR ordering changed how our guests experience dining. Our kitchen runs smoother and billing takes seconds now. The team personally set everything up for us and they\'re always available.',
    name: 'Our First Partner Restaurant',
    location: 'Bhubaneswar, Odisha',
    badge: '✓ Verified · DineDeck Partner Since Day 1',
    real: true,
  },
]

// ─── CONTACT INFO OVERHAUL (CHANGE 2) ───
export const CONTACT_INFO = {
  header: 'Get In Touch',
  subtitle: 'We respond within 2 hours · Mon–Sat, 9am–8pm',
  email: 'contact.dinedeck@gmail.com',
  whatsapp_note: "We'll WhatsApp you back",
}

// ─── LIVE DEMO STEPS ───
export const DEMO_STEPS = [
  { 
    id: 'scan', 
    tab: '1. Scan', 
    title: 'Customer Scans QR', 
    subtitle: 'No apps to download. Guests scan the unique QR on their table to open your digital menu instantly.',
    badge: 'Frictionless Entry'
  },
  { 
    id: 'menu', 
    tab: '2. Order', 
    title: 'Browse & Customize', 
    subtitle: 'High-quality photos and real-time availability. Guests add items to their cart and customize toppings with ease.',
    badge: 'Interactive Menu'
  },
  { 
    id: 'cart', 
    tab: '3. Pay', 
    title: 'Place & Pay', 
    subtitle: 'Orders go straight to the kitchen. Optional UPI integration lets guests pay safely from their phones.',
    badge: 'Instant Checkout'
  },
  { 
    id: 'kot', 
    tab: '4. Serve', 
    title: 'Kitchen Sync', 
    subtitle: 'The kitchen gets a digital ticket immediately. No more shouting orders or lost handwritten paper slips.',
    badge: 'Kitchen Harmony'
  },
]

// ─── FEATURE DEEP DIVES ───
export const FEATURE_DEEPDIVES = [
  {
    title: "The Smartest Billing Experience in India",
    subtitle: "Stop using slow, clunky POS software. Experience DineDeck's lightning-fast checkout built for the modern Indian restaurant.",
    bullets: [
      "Process bills in under 10 seconds",
      "Automatic GST & Service Charge calculations",
      "Split bills and handle partial payments",
      "Print to thermal printers or share via WhatsApp"
    ],
    visual: 'POSVisual'
  },
  {
    title: "Kitchen Sync: Zero Errors, Maximum Speed",
    subtitle: "Bridge the gap between your waiters and your chefs. Every order is tracked, timed, and prioritized automatically.",
    bullets: [
      "Direct KOT printing to multiple kitchen stations",
      "Color-coded urgency alerts for delayed orders",
      "Real-time item availability sync with menu",
      "Detailed prep-time analytics for every dish"
    ],
    visual: 'KitchenVisual'
  },
  {
    title: "Data That Actually Grows Your Profits",
    subtitle: "Stop guessing. Start knowing. Our analytics dashboard gives you the insights you need to optimize your menu and staff.",
    bullets: [
      "Identify high-profit vs high-volume dishes",
      "Track peak-hour heatmaps for better scheduling",
      "Monitor stock levels and prevent inventory leakage",
      "Daily automated revenue reports to your WhatsApp"
    ],
    visual: 'AnalyticsVisual'
  }
]

// ─── HOW IT WORKS STEPS ───
export const HOW_IT_WORKS_STEPS = [
  {
    number: '01',
    title: 'Onboarding',
    description: 'We set up your digital menu and hardware in under 60 minutes. Your staff gets trained on the spot.'
  },
  {
    number: '02',
    title: 'Go Live',
    description: 'Guests start scanning and ordering. Your kitchen starts receiving digital tickets immediately.'
  },
  {
    number: '03',
    title: 'Grow',
    description: 'Use real-time data to optimize your menu and increase turnover. We support you 24/7 as you scale.'
  }
]



