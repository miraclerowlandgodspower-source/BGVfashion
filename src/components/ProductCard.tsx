"use client";

import React from "react";
import Link from "next/link";
import { Product } from "@/types";
import { useStore } from "@/context/StoreContext";
import { formatMoney } from "@/lib/money";
import { HeartIcon } from "./Icons";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isWishlisted, toggleWishlist, addToCart, currency } = useStore();
  const wished = isWishlisted(product.id);

  return (
    <article className="product-card">
      <button
        type="button"
        className={`wish-button ${wished ? "wished" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
        aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        aria-pressed={wished}
      >
        <HeartIcon filled={wished} />
      </button>

      <Link href={`/product/${product.id}`}>
        <div className={`photo q${product.quadrant}`}>
          <img
            src={`/images/${product.sheet}`}
            alt={product.name}
            width={1024}
            height={1536}
            loading="lazy"
          />
        </div>

        <div className="product-info">
          <div className="product-heading-row">
            <h3 className="product-name">{product.name}</h3>
            {product.inStock !== false && <span className="stock-badge">In stock</span>}
          </div>
          <div className="swatches" aria-label="Available colours">
            {product.colors.map((color) => (
              <span
                key={color}
                className="swatch"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <p className="price">{formatMoney(product.price, currency)}</p>
          <button type="button" className="quick-add" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (product.sizes[0]) addToCart(product, product.sizes[0]);
          }} disabled={!product.inStock || product.sizes.length === 0}>
            {product.inStock === false ? "Sold out" : "Quick add"}<span aria-hidden="true">+</span>
          </button>
        </div>
      </Link>
    </article>
  );
}
