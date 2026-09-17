"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, CartItem, Product } from "@/types";

interface ToastState {
  message: string;
  visible: boolean;
}

interface StoreContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  cart: CartItem[];
  addToCart: (product: Product, size: string, quantity?: number) => Promise<void>;
  updateCartQuantity: (productId: string, size: string, delta: number) => Promise<void>;
  removeFromCart: (productId: string, size: string) => Promise<void>;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  country: string;
  setCountry: (country: string) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  toast: ToastState;
  showToast: (message: string) => void;
  isRegionModalOpen: boolean;
  setIsRegionModalOpen: (open: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_CART_KEY = "bgv_cart_v1";
const STORAGE_WISHLIST_KEY = "bgv_wishlist_v1";
const STORAGE_PREFS_KEY = "bgv_prefs_v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [country, setCountry] = useState<string>("Nigeria");
  const [currency, setCurrency] = useState<string>("NGN");
  const [isRegionModalOpen, setIsRegionModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({ message: "", visible: false });

  // 1. Check current logged-in user on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json.success && json.data?.user) {
          setUser(json.data.user);
        }
      } catch (err) {
        console.warn("Auth check notice:", err);
      }
    }
    checkAuth();
  }, []);

  // 2. Load stored preferences, cart, and wishlist
  useEffect(() => {
    try {
      const savedPrefs = localStorage.getItem(STORAGE_PREFS_KEY);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.country) setCountry(parsed.country);
        if (parsed.currency) setCurrency(parsed.currency);
      }

      const savedCart = localStorage.getItem(STORAGE_CART_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }

      const savedWishlist = localStorage.getItem(STORAGE_WISHLIST_KEY);
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    } catch (e) {
      console.warn("Local storage parse notice:", e);
    }
  }, []);

  // 3. Save cart changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // 4. Save wishlist changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WISHLIST_KEY, JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  // 5. Save preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify({ country, currency }));
    } catch {}
  }, [country, currency]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast({ message: "", visible: false });
    }, 3500);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      showToast("Signed out successfully.");
    } catch {
      setUser(null);
    }
  };

  const addToCart = async (product: Product, size: string, quantity = 1) => {
    if (!product.sizes.includes(size)) {
      throw new Error("Please select an available size.");
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id && item.size === size);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id && item.size === size
            ? { ...item, quantity: Math.min(10, item.quantity + quantity) }
            : item
        );
      } else {
        return [...prev, { productId: product.id, size, quantity: Math.min(10, quantity), product }];
      }
    });

    // Also notify server if user is logged in
    try {
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, size, quantity }),
      }).catch(() => {});
    } catch {}

    showToast(`Added ${product.name} (${size}) to your bag.`);
  };

  const updateCartQuantity = async (productId: string, size: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId && item.size === size) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: Math.min(10, newQty) } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });

    showToast("Shopping bag updated.");
  };

  const removeFromCart = async (productId: string, size: string) => {
    setCart((prev) => prev.filter((item) => !(item.productId === productId && item.size === size)));
    showToast("Item removed from your bag.");
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = async (productId: string) => {
    const exists = wishlist.includes(productId);
    const newWishlist = exists ? wishlist.filter((id) => id !== productId) : [...wishlist, productId];
    setWishlist(newWishlist);

    try {
      fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      }).catch(() => {});
    } catch {}

    showToast(exists ? "Removed from your wishlist." : "Saved to your wishlist.");
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const cartSubtotal = cart.reduce((total, item) => {
    const price = item.product?.price || 0;
    return total + price * item.quantity;
  }, 0);

  return (
    <StoreContext.Provider
      value={{
        user,
        setUser,
        logout,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        wishlist,
        toggleWishlist,
        isWishlisted,
        country,
        setCountry,
        currency,
        setCurrency,
        toast,
        showToast,
        isRegionModalOpen,
        setIsRegionModalOpen,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
