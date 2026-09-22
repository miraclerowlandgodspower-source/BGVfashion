"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatMoney } from "@/lib/money";
import { calculateVatFee } from "@/lib/order-totals";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const { cart, updateCartQuantity, removeFromCart, cartSubtotal, currency, user, authReady } = useStore();

  const shippingEstimate = 3500;
  const vatFee = calculateVatFee(shippingEstimate);
  const orderTotal = cartSubtotal + shippingEstimate + vatFee;

  React.useEffect(() => {
    if (authReady && !user) router.replace(`/login?returnTo=${encodeURIComponent("/cart")}`);
  }, [authReady, router, user]);

  if (!authReady || !user) {
    return <div className="wrap" style={{ padding: "100px 0", textAlign: "center" }}><h2>Sign in to review your shopping bag.</h2><p style={{ color: "var(--muted)", marginTop: "12px" }}>Redirecting you to secure sign in...</p></div>;
  }

  if (cart.length === 0) {
    return (
      <div className="wrap" style={{ padding: "60px 0 100px" }}>
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Your Bag</span>
        </div>

        <div className="empty-state" style={{ marginTop: "30px" }}>
          <h2>Your shopping bag is empty.</h2>
          <p>Explore our latest women’s and men’s edits to find your next statement piece.</p>
          <Link href="/shop" className="button coral">
            Explore the Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ paddingBottom: "80px" }}>
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Your Bag</span>
      </div>

      <header className="page-head">
        <p className="eyebrow">YOUR SELECTION</p>
        <h1 className="page-title">Shopping Bag</h1>
        <p className="page-intro">Review your selected pieces and sizes before proceeding to secure checkout.</p>
      </header>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.map((item, index) => {
            const product = item.product;
            if (!product) return null;

            const lineTotal = product.price * item.quantity;

            return (
              <article key={`${item.productId}-${item.size}-${index}`} className="cart-row">
                <Link href={`/product/${product.id}`} className="cart-photo-link">
                  <div className={`photo cart-photo q${product.quadrant}`}>
                    <img
                      src={`/images/${product.sheet}`}
                      alt={product.name}
                      width={1024}
                      height={1536}
                    />
                  </div>
                </Link>

                <div className="cart-details">
                  <h2>
                    <Link href={`/product/${product.id}`}>{product.name}</Link>
                  </h2>
                  <p>Size: {item.size}</p>
                  {product.colors?.[0] && <p>Colour: {product.colors[0]}</p>}
                  <p className="price">{formatMoney(lineTotal, currency)}</p>

                  <div className="quantity-controls">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.productId, item.size, -1)}
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.productId, item.size, 1)}
                      disabled={item.quantity >= 10}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="remove-item"
                  onClick={() => removeFromCart(item.productId, item.size)}
                  aria-label={`Remove ${product.name} from bag`}
                >
                  Remove
                </button>
              </article>
            );
          })}
        </div>

        <aside className="order-summary" aria-label="Order summary">
          <h2>Order Summary</h2>

          <div className="summary-line">
            <span>Items Subtotal</span>
            <span>{formatMoney(cartSubtotal, currency)}</span>
          </div>

          <div className="summary-line">
            <span>Estimated Delivery</span>
            <span>{formatMoney(shippingEstimate, currency)}</span>
          </div>

          <div className="summary-line">
            <span>VAT (7% of delivery)</span>
            <span>{formatMoney(vatFee, currency)}</span>
          </div>

          <div className="summary-line summary-total">
            <span>Total</span>
            <span>{formatMoney(orderTotal, currency)}</span>
          </div>

          <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "14px 0" }}>
            {cartSubtotal > 100000
              ? "✓ You qualify for complimentary express delivery."
              : "Complimentary express delivery on orders over ₦100,000."}
          </p>

          <Link href="/checkout" className="button coral full-width">
            Proceed to Checkout
          </Link>

          <Link
            href="/shop"
            className="button secondary full-width"
            style={{ marginTop: "10px", textAlign: "center" }}
          >
            Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
