import {
  BadgeCheck,
  CalendarClock,
  CarFront,
  CircleHelp,
  Fuel,
  Headset,
  MapPinned,
  ShieldCheck,
  Sparkles,
  TicketPercent,
} from 'lucide-react';

export const ROLE_DASHBOARD_PATHS = {
  customer: '/dashboard/customer',
  vehicle_manager: '/dashboard/manager',
  admin: '/dashboard/admin',
};

export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Vehicles', to: '/vehicles' },
  { label: 'Bookings', to: '/booking/history' },
];

export const USP_ITEMS = [
  { title: 'Fast Service', description: 'Instant availability, transparent pricing, and polished delivery.', icon: Sparkles },
  { title: 'No Hidden Charges', description: 'Every booking breaks down cost, taxes, and rental duration up front.', icon: TicketPercent },
  { title: 'Distinctive Fleet', description: 'Electric commuters, executive SUVs, and utility-ready vans in one place.', icon: CarFront },
  { title: 'Unlimited Mileage', description: 'Most city and airport rentals include generous distance limits and support.', icon: Fuel },
];

export const FEATURE_ITEMS = [
  { title: 'Verified Fleet Managers', description: 'Every listing is owned by an approved fleet manager with role-based access.', icon: ShieldCheck },
  { title: 'Live Availability', description: 'Redis-backed availability checks reduce stale inventory and booking clashes.', icon: CalendarClock },
  { title: 'Smarter Search', description: 'Filter by type, fuel, price band, and availability without leaving the page.', icon: BadgeCheck },
  { title: 'Destination Coverage', description: 'Browse pickups across airport, downtown, corporate, and leisure hubs.', icon: MapPinned },
  { title: 'Always-On Support', description: 'Customer care details and self-serve booking history keep renters informed.', icon: Headset },
  { title: 'Helpful Answers', description: 'A guided FAQ keeps the path from discovery to checkout friction-light.', icon: CircleHelp },
];

export const BRAND_LOGOS = ['Thrifty', 'National', 'Alamo', 'Hertz', 'Europcar', 'United'];

export const DESTINATIONS = [
  {
    id: 'city',
    title: 'City Escapes',
    subtitle: 'High-frequency business and leisure pickups',
    image:
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80',
    locations: ['New York', 'Chicago', 'Austin'],
  },
  {
    id: 'coastal',
    title: 'Coastal Drives',
    subtitle: 'Premium convertibles and SUVs for sea-side road trips',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    locations: ['Miami', 'San Diego', 'Los Angeles'],
  },
  {
    id: 'mountain',
    title: 'Mountain Routes',
    subtitle: 'Adventure-ready traction and roomy cabins',
    image:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    locations: ['Denver', 'Bozeman', 'Salt Lake City'],
  },
];

export const SIZE_CARDS = [
  {
    title: 'Cars',
    priceRange: '$39 - $129 / day',
    description: 'Best for agile city travel, airport hops, and solo or couple journeys.',
    image:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'SUVs',
    priceRange: '$96 - $176 / day',
    description: 'Roomy, confident, and ideal for family trips or executive travel.',
    image:
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Vans',
    priceRange: '$165 - $189 / day',
    description: 'Group-ready seating and luggage capacity without sacrificing comfort.',
    image:
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
  },
];

export const FAQ_ITEMS = [
  {
    question: 'How does availability stay accurate?',
    answer:
      'The platform checks overlap in MySQL and also places a short Redis lock around each booking attempt, so only one request can secure the same vehicle slot at a time.',
  },
  {
    question: 'Can I cancel a booking online?',
    answer:
      'Customers can cancel their own pending bookings from booking history, while managers and admins can handle broader booking state changes from their dashboards.',
  },
  {
    question: 'Who manages the listed vehicles?',
    answer:
      'Each vehicle is attached to a verified vehicle manager account. Admins can oversee all fleet records and customer access from the control dashboard.',
  },
  {
    question: 'Is pricing calculated in real time?',
    answer:
      'Yes. Booking forms recalculate total cost immediately from the selected dates and the daily rental rate returned by the backend.',
  },
];

export const SUPPORT_LINKS = {
  corporate: ['About Us', 'Careers', 'Fleet Partnerships', 'Investor Relations'],
  rental: ['Airport Rentals', 'Business Travel', 'Weekend Deals', 'Long-Term Hire'],
  support: ['Help Center', 'Contact Support', 'Terms & Conditions', 'Privacy Policy'],
};

export const MAP_LOCATIONS = [
  { name: 'Downtown Hub', position: [40.7128, -74.006] },
  { name: 'Airport Desk', position: [41.9786, -87.9048] },
  { name: 'Tech District', position: [30.2672, -97.7431] },
];

export const BOOKING_STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-sky-100 text-sky-800',
  active: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-rose-100 text-rose-800',
};
