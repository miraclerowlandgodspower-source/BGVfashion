"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatMoney } from "@/lib/money";

export default function CartPage() {
  const { cart, updateCartQuantity, removeFromCart, cartSubtotal, currency } = useStore();

  const shippingEstimate = cartSubtotal > 100000 || cartSubtotal === 0 ? 0 : 3500;
  const orderTotal = cartSubtotal + shippingEstimate;

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
        <div>
          {cart.map((item, index) => {
            const product = item.product;
            if (!product) return null;

            const lineTotal = product.price * item.quantity;

            return (
              <article key={`${item.productId}-${item.size}-${index}`} className="cart-row">
                <Link href={`/product/${product.id}`}>
                  <div className={`photo q${product.quadrant}`} style={{ width: "110px" }}>
                    <img
                      src={`/images/${product.sheet}`}
                      alt={product.name}
                      width={1024}
                      height={1536}
                    />
                  </div>
                </Link>

                <div>
                  <h2>
                    <Link href={`/product/${product.id}`}>{product.name}</Link>
                  </h2>
                  <p>Size: {item.size}</p>
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
            <span>
              {shippingEstimate === 0 ? "Complimentary" : formatMoney(shippingEstimate, currency)}
            </span>
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
