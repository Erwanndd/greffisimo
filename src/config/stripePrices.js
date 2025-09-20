export const STRIPE_PRICE_OPTIONS = [
  {
    key: '1',
    label: 'Price 1',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_1 || '',
    productId: import.meta.env.VITE_STRIPE_PRODUCT_ID_1 || '',
  },
  {
    key: '2',
    label: 'Price 2',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_2 || '',
    productId: import.meta.env.VITE_STRIPE_PRODUCT_ID_2 || '',
  },
  {
    key: '3',
    label: 'Price 3',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_3 || '',
    productId: import.meta.env.VITE_STRIPE_PRODUCT_ID_3 || '',
  },
];

export const getStripePriceIdByKey = (key) => {
  const item = STRIPE_PRICE_OPTIONS.find(o => o.key === String(key));
  return item?.priceId || '';
};

// Returns the Stripe Price ID to use for a given formality.
// For now, always use a default configured price ID.
export const getStripePriceIdForFormality = (_formality) => {
  const def = import.meta.env.VITE_STRIPE_PRICE_ID_DEFAULT || '';
  if (def) return def;
  const first = STRIPE_PRICE_OPTIONS.find(o => o.priceId);
  return first?.priceId || '';
};
