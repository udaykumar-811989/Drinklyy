export const shopStorageKeys = {
  products: 'drinkly_shop_products',
  orders: 'drinkly_shop_orders',
  offers: 'drinkly_shop_offers',
  profile: 'drinkly_shop_profile',
  notifications: 'drinkly_shop_notifications',
  settings: 'drinkly_shop_settings',
  compliance: 'drinkly_shop_compliance',
  session: 'drinkly_shop_session'
}

export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    return parsed
  } catch (error) {
    return fallback
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const defaultShopProfile = {
  shopName: 'North Star Wines',
  ownerName: 'Rohan Mehta',
  phone: '+91 98765 43210',
  email: 'rohan@northstarwines.in',
  address: '12th Main Road, Koramangala, Bengaluru',
  deliveryRadius: '8 km',
  description: 'Curated premium beverages for fast urban delivery.',
  status: 'Online',
  openingHours: {
    Monday: { open: true, openTime: '10:00', closeTime: '22:00' },
    Tuesday: { open: true, openTime: '10:00', closeTime: '22:00' },
    Wednesday: { open: true, openTime: '10:00', closeTime: '22:00' },
    Thursday: { open: true, openTime: '10:00', closeTime: '22:00' },
    Friday: { open: true, openTime: '10:00', closeTime: '23:00' },
    Saturday: { open: true, openTime: '11:00', closeTime: '23:00' },
    Sunday: { open: false, openTime: '10:00', closeTime: '20:00' }
  },
  logo: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80'
}

export const defaultShopCompliance = {
  licenceStatus: 'ACTIVE',
  licenceNumber: 'MOCK-LICENCE-001',
  licenceExpiry: '2027-06-30',
  approvalStatus: 'APPROVED',
  jurisdiction: 'Demo Jurisdiction',
  alcoholSalesEnabled: true,
  deliveryAreaConfigured: true,
  operatingHoursConfigured: true,
  productReviewConfigured: true,
  deliveryAuthorization: true,
  warning: null
}

export const defaultShopSettings = {
  emailNotifications: true,
  newOrderNotifications: true,
  lowStockNotifications: true,
  offerNotifications: true,
  soundNotifications: true,
  compliancePreferences: true,
  twoFactorEnabled: false,
  autoAcceptOrders: false
}

export const defaultShopProducts = [
  {
    id: 'product-corona',
    name: 'Corona Extra',
    brand: 'Corona',
    category: 'Beer',
    size: '330ml',
    alcoholPercentage: 4.5,
    price: 299,
    discountPrice: 279,
    stock: 42,
    lowStockThreshold: 8,
    description: 'Refreshing lager with a crisp citrus finish.',
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80',
    tastingNotes: 'Citrus, malt, clean finish',
    origin: 'Mexico',
    productType: 'Lager'
  },
  {
    id: 'product-budweiser',
    name: 'Budweiser',
    brand: 'Budweiser',
    category: 'Beer',
    size: '330ml',
    alcoholPercentage: 5,
    price: 249,
    discountPrice: 229,
    stock: 3,
    lowStockThreshold: 8,
    description: 'A classic American lager with smooth character.',
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1523567856296-11d39f0d3f87?auto=format&fit=crop&w=400&q=80',
    tastingNotes: 'Balance, malt, slight hops',
    origin: 'USA',
    productType: 'Lager'
  },
  {
    id: 'product-heineken',
    name: 'Heineken',
    brand: 'Heineken',
    category: 'Beer',
    size: '330ml',
    alcoholPercentage: 5,
    price: 279,
    discountPrice: 259,
    stock: 19,
    lowStockThreshold: 10,
    description: 'Crisp, balanced and easy-drinking.',
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1608219994159-5c130d4a9ce2?auto=format&fit=crop&w=400&q=80',
    tastingNotes: 'Malt, fresh hops, clean finish',
    origin: 'Netherlands',
    productType: 'Pilsner'
  },
  {
    id: 'product-royal-stag',
    name: 'Royal Stag',
    brand: 'Royal Stag',
    category: 'Whisky',
    size: '750ml',
    alcoholPercentage: 42.8,
    price: 1499,
    discountPrice: 1399,
    stock: 11,
    lowStockThreshold: 5,
    description: 'Smoky blended whisky for premium evenings.',
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80',
    tastingNotes: 'Vanilla, oak, peat',
    origin: 'India',
    productType: 'Blended Whisky'
  },
  {
    id: 'product-smirnoff',
    name: 'Smirnoff',
    brand: 'Smirnoff',
    category: 'Vodka',
    size: '750ml',
    alcoholPercentage: 37.5,
    price: 1299,
    discountPrice: 1199,
    stock: 0,
    lowStockThreshold: 6,
    description: 'Clean spirit ideal for mixed cocktails.',
    status: 'OUT_OF_STOCK',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
    tastingNotes: 'Neutral, smooth, crisp',
    origin: 'Global',
    productType: 'Vodka'
  }
]

export const defaultShopOrders = [
  {
    id: 'DRK123456',
    customer: 'Aisha J.',
    customerLabel: 'Aisha J.',
    time: 'Today, 8:42 PM',
    items: 3,
    total: 2499,
    status: 'NEW',
    address: '12th Main Road, Koramangala, Bengaluru',
    itemsList: [
      { product: 'Corona Extra', quantity: 2, price: 299 },
      { product: 'Heineken', quantity: 1, price: 279 }
    ],
    rejectionReason: '',
    timeline: ['Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Delivered']
  },
  {
    id: 'DRK123457',
    customer: 'Rahul S.',
    customerLabel: 'Rahul S.',
    time: 'Today, 7:12 PM',
    items: 2,
    total: 1799,
    status: 'ACCEPTED',
    address: 'HSR Layout, Bengaluru',
    itemsList: [
      { product: 'Budweiser', quantity: 2, price: 249 },
      { product: 'Royal Stag', quantity: 1, price: 1499 }
    ],
    rejectionReason: '',
    timeline: ['Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Delivered']
  },
  {
    id: 'DRK123458',
    customer: 'Nisha R.',
    customerLabel: 'Nisha R.',
    time: 'Today, 6:05 PM',
    items: 4,
    total: 2199,
    status: 'PREPARING',
    address: 'Indiranagar, Bengaluru',
    itemsList: [
      { product: 'Heineken', quantity: 3, price: 279 },
      { product: 'Corona Extra', quantity: 1, price: 299 }
    ],
    rejectionReason: '',
    timeline: ['Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Delivered']
  },
  {
    id: 'DRK123459',
    customer: 'Kabir M.',
    customerLabel: 'Kabir M.',
    time: 'Today, 5:18 PM',
    items: 2,
    total: 1199,
    status: 'READY_FOR_PICKUP',
    address: 'Jayanagar, Bengaluru',
    itemsList: [
      { product: 'Royal Stag', quantity: 1, price: 1499 },
      { product: 'Smirnoff', quantity: 1, price: 1299 }
    ],
    rejectionReason: '',
    timeline: ['Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Delivered']
  },
  {
    id: 'DRK123460',
    customer: 'Priyanka V.',
    customerLabel: 'Priyanka V.',
    time: 'Yesterday, 10:14 PM',
    items: 1,
    total: 599,
    status: 'DELIVERED',
    address: 'Banaswadi, Bengaluru',
    itemsList: [
      { product: 'Corona Extra', quantity: 2, price: 299 }
    ],
    rejectionReason: '',
    timeline: ['Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Delivered']
  }
]

export const defaultShopOffers = [
  {
    id: 'offer-1',
    name: 'Weekend Cheers',
    type: 'Percentage',
    value: 15,
    products: ['Corona Extra', 'Heineken'],
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    minimumOrder: 999,
    maximumDiscount: 350,
    status: 'ACTIVE'
  },
  {
    id: 'offer-2',
    name: 'Premium Mix Pack',
    type: 'Fixed Amount',
    value: 200,
    products: ['Royal Stag', 'Smirnoff'],
    startDate: '2026-09-15',
    endDate: '2026-09-22',
    minimumOrder: 2000,
    maximumDiscount: 500,
    status: 'SCHEDULED'
  }
]

export const defaultShopNotifications = [
  {
    id: 'notice-1',
    title: 'New order received',
    message: 'Order #DRK123456 is waiting for acceptance.',
    time: 'Just now',
    read: false
  },
  {
    id: 'notice-2',
    title: 'Low stock',
    message: 'Budweiser has only 3 units remaining.',
    time: '30 mins ago',
    read: false
  },
  {
    id: 'notice-3',
    title: 'Compliance warning',
    message: 'Licence expiry is approaching.',
    time: '1 hour ago',
    read: true
  }
]

export const defaultShopAnalytics = {
  todaySales: 18450,
  weeklySales: 76480,
  monthlySales: 248600,
  totalOrders: 132,
  averageOrderValue: 1896,
  topProducts: [
    { name: 'Corona Extra', value: 128 },
    { name: 'Heineken', value: 104 },
    { name: 'Budweiser', value: 92 },
    { name: 'Royal Stag', value: 68 }
  ],
  salesData: [42, 65, 56, 78, 74, 91, 88],
  orderData: [18, 24, 20, 28, 26, 31, 34]
} 
