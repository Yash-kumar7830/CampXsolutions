const genericPhotos = [
    { keywords: ['watch'], image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85' },
    { keywords: ['wallet'], image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=85' },
    { keywords: ['key', 'keys'], image: 'https://images.unsplash.com/photo-1559253664-ca249d4608c6?auto=format&fit=crop&w=900&q=85' },
    { keywords: ['bag', 'backpack'], image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85' },
    { keywords: ['glasses', 'eyeglasses'], image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=900&q=85' },
    { keywords: ['headphone', 'headphones', 'earbuds'], image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85' },
    { keywords: ['phone', 'smartphone'], image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85' },
    { keywords: ['bottle'], image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85' },
];

const defaultImage = 'https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?auto=format&fit=crop&w=900&q=85';

export function getGenericItemImage(title, category) {
    const text = `${title} ${category}`.toLowerCase();
    const match = genericPhotos.find(({ keywords }) => keywords.some((keyword) => new RegExp(`\\b${keyword}\\b`).test(text)));
    return match?.image ?? defaultImage;
}
