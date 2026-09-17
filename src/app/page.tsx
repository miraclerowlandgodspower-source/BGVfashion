import React from "react";
import Link from "next/link";
import { getProducts } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";

export default async function HomePage() {
  const products = await getProducts();
  const featured = products.slice(0, 4);

  const categories = [
    { name: "Dresses", id: "plum-midi", sheet: "women.png", quadrant: 0 },
    { name: "Denim", id: "wide-denim", sheet: "women.png", quadrant: 1 },
    { name: "Sets", id: "cream-set", sheet: "women.png", quadrant: 2 },
    { name: "Streetwear", id: "black-hoodie", sheet: "men.png", quadrant: 1 },
  ];

  return (
    <>
      <section className="hero">
        <img
          className="hero-image"
          src="/images/hero.png"
          alt="Models wearing BGV-inspired contemporary collection"
          width={1536}
          height={1024}
        />
        <div className="hero-content">
          <p className="eyebrow">THE BGV EDIT</p>
          <h1>
            Your
            <br />
            next look.
          </h1>
          <p>Different styles. Same energy. Modern pieces tailored for you.</p>
          <div className="hero-actions">
            <Link href="/shop?department=Women" className="button coral">
              Shop Women <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/shop?department=Men" className="button outlined">
              Shop Men <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <span className="hero-caption">Everyday pieces. Entirely you.</span>
      </section>

      <section className="section wrap" aria-labelledby="category-title">
        <div className="section-heading">
          <h2 id="category-title">Find your vibe.</h2>
          <Link href="/shop" className="text-link">
            Shop all <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="category-grid">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/shop?category=${cat.name}`}
              className="category-card"
            >
              <div className={`photo q${cat.quadrant}`}>
                <img
                  src={`/images/${cat.sheet}`}
                  alt={cat.name}
                  width={1024}
                  height={1536}
                />
              </div>
              <span className="category-label">
                {cat.name} <span aria-hidden="true">↗</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section wrap" aria-labelledby="new-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FRESH PERSPECTIVE</p>
            <h2 id="new-title">New in. All you.</h2>
          </div>
          <Link href="/shop" className="text-link">
            Explore the collection <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="brand-strip wrap">
        <span className="wordmark">BGV</span>
        <p>
          Dress for yourself.
          <br />
          Show up as you.
        </p>
        <Link href="/about" className="button">
          Meet BGV <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </>
  );
}
