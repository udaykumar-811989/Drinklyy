export const categories = [
  { id: 'beer', name: 'Beer', icon: 'beer', image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=240&q=85', count: 42 },
  { id: 'whisky', name: 'Whisky', icon: 'whisky', image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=240&q=85', count: 36 },
  { id: 'vodka', name: 'Vodka', icon: 'vodka', image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=240&q=85', count: 28 },
  { id: 'rum', name: 'Rum', icon: 'rum', image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=240&q=85', count: 24 },
  { id: 'wine', name: 'Wine', icon: 'wine', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=240&q=85', count: 38 },
]

const bottleImages = {
  corona: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=600&q=85',
  heineken: 'https://images.unsplash.com/photo-1614313511387-1436a4480ebb?auto=format&fit=crop&w=600&q=85',
  budweiser: 'https://images.unsplash.com/photo-1575367439058-6096bb9cf5e2?auto=format&fit=crop&w=600&q=85',
  kingfisher: 'https://images.unsplash.com/photo-1622445275576-721325763afe?auto=format&fit=crop&w=600&q=85',
  whisky: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=85',
  wine: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=85',
}

export const products = [
  { id: 'corona-extra', name: 'Corona Extra', brand: 'Corona', category: 'beer', size: '330ml', alcoholPercentage: '4.5%', price: 299, oldPrice: 329, rating: 4.6, image: bottleImages.corona, description: 'Corona Extra is a refreshing lager with a crisp, clean taste and a hint of citrus.', shopId: 'drinkly-store', inStock: true },
  { id: 'heineken', name: 'Heineken', brand: 'Heineken', category: 'beer', size: '330ml', alcoholPercentage: '5%', price: 279, oldPrice: 299, rating: 4.5, image: bottleImages.heineken, description: 'A balanced golden lager with a mild bitter taste and a crisp finish.', shopId: 'drinkly-store', inStock: true },
  { id: 'budweiser', name: 'Budweiser', brand: 'Budweiser', category: 'beer', size: '330ml', alcoholPercentage: '5%', price: 249, oldPrice: 279, rating: 4.4, image: bottleImages.budweiser, description: 'A smooth American-style lager brewed with the finest barley and hops.', shopId: 'drinkly-store', inStock: true },
  { id: 'kingfisher-premium', name: 'Kingfisher Premium', brand: 'Kingfisher', category: 'beer', size: '330ml', alcoholPercentage: '4.8%', price: 199, oldPrice: 219, rating: 4.3, image: bottleImages.kingfisher, description: 'India’s favourite premium lager, light, refreshing and easy to enjoy.', shopId: 'drinkly-store', inStock: true },
  { id: 'glenfiddich', name: 'Glenfiddich 12', brand: 'Glenfiddich', category: 'whisky', size: '750ml', alcoholPercentage: '40%', price: 4899, oldPrice: 5299, rating: 4.8, image: bottleImages.whisky, description: 'A beautifully balanced single malt with fresh pear, oak and a long finish.', shopId: 'reserve-cellar', inStock: true },
  { id: 'sula-red', name: 'Sula Shiraz', brand: 'Sula', category: 'wine', size: '750ml', alcoholPercentage: '13%', price: 799, oldPrice: 899, rating: 4.2, image: bottleImages.wine, description: 'A rich Indian red with ripe berry notes and a smooth, rounded finish.', shopId: 'reserve-cellar', inStock: true },
]

export const shops = [{ id: 'drinkly-store', name: 'Drinklyy Store', distance: '1.2 km away', eta: '20-30 min' }, { id: 'reserve-cellar', name: 'Reserve Cellar', distance: '2.5 km away', eta: '30-40 min' }]
export const orders = [{ id: 'DRK123456', status: 'Out for delivery', total: 597, items: ['Corona Extra', 'Budweiser'], eta: '12 minutes' }]
export const offers = [{ title: 'Cheers to Good Times!', subtitle: 'Premium Drinks\nDelivered in Minutes', action: 'SHOP NOW' }]
