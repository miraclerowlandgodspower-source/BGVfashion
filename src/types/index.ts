export interface Product {
  id: string;
  name: string;
  department: "Women" | "Men" | "Unisex";
  category: string;
  price: number; // in minor units or whole NGN
  sheet: string; // image file in /images/
  quadrant: 0 | 1 | 2 | 3;
  colors: string[];
  sizes: string[];
  description: string;
  inStock?: boolean;
  featured?: boolean;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: "customer" | "admin";
  createdAt?: string;
}

export interface CartItem {
  id?: string;
  productId: string;
  size: string;
  quantity: number;
  product?: Product;
}

export interface WishlistItem {
  id?: string;
  productId: string;
  product?: Product;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerEmail: string;
  customerName: string;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  shippingFee: number;
  taxFee: number;
  totalAmount: number;
  currency: string;
  shippingAddress: ShippingAddress;
  paystackReference?: string;
  paystackAccessCode?: string;
  paidAt?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
