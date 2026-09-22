export const VAT_RATE = 0.07;
export const MINIMUM_DELIVERY_FEE = 3500;

export function calculateVatFee(deliveryFee: number): number {
  return Math.round(Math.max(0, deliveryFee) * VAT_RATE);
}

export function calculateOrderTotal(subtotal: number, deliveryFee: number): {
  subtotal: number;
  deliveryFee: number;
  vatFee: number;
  total: number;
} {
  const normalizedDeliveryFee = Math.max(MINIMUM_DELIVERY_FEE, Math.round(deliveryFee));
  const normalizedSubtotal = Math.max(0, Math.round(subtotal));
  const vatFee = calculateVatFee(normalizedDeliveryFee);

  return {
    subtotal: normalizedSubtotal,
    deliveryFee: normalizedDeliveryFee,
    vatFee,
    total: normalizedSubtotal + normalizedDeliveryFee + vatFee,
  };
}
