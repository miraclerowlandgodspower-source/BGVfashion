import Link from "next/link";
import { getProducts } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";

const categories = [
  { name: "Women", image: "women.png", position: "q0" },
  { name: "Men", image: "men.png", position: "q1" },
  { name: "Sets", image: "women.png", position: "q2" },
  { name: "Streetwear", image: "men.png", position: "q3" },
  { name: "Dresses", image: "women.png", position: "q0" },
  { name: "Accessories", image: "women.png", position: "q1" },
  { name: "Jackets", image: "men.png", position: "q2" },
  { name: "Tailoring", image: "men.png", position: "q0" },
];

const services = [
  ["01", "Secure checkout", "Encrypted payments through Paystack"],
  ["02", "Worldwide delivery", "Express fulfilment across 193 countries"],
  ["03", "Easy returns", "A considered 14-day returns policy"],
  ["04", "Client concierge", "Personal support, whenever you need it"],
];

export default async function HomePage() {
  const products = await getProducts();
  const newArrivals = products.filter((product) => product.newArrival).slice(0, 4);
  const bestSellers = products.filter((product) => product.featured).slice(0, 4);
  const featured = newArrivals.length ? newArrivals : products.slice(0, 4);

  return (
    <div className="home-page">
      <section className="luxury-hero" aria-labelledby="hero-title">
        <img src="/images/hero.png" alt="BGV contemporary fashion campaign" width={1536} height={1024} />
        <div className="hero-shade" />
        <div className="hero-orbit" aria-hidden="true" />
        <div className="luxury-hero-copy">
          <p className="eyebrow gold-eyebrow">BGV / 001 — THE NEW FORM</p>
          <h1 id="hero-title">Dress beyond<br /><em>the expected.</em></h1>
          <p className="hero-dek">A considered wardrobe for the next version of you.</p>
          <div className="hero-actions">
            <Link href="/shop?department=Women" className="luxury-button gold-button">Shop Women <span>↗</span></Link>
            <Link href="/shop?department=Men" className="luxury-button glass-button">Shop Men <span>↗</span></Link>
          </div>
        </div>
        <div className="hero-meta"><span>OJO / LAGOS</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>

      <section className="home-section arrivals-section wrap" aria-labelledby="arrivals-title">
        <div className="section-heading dark-heading"><div><p className="eyebrow">THE LATEST SIGNAL</p><h2 id="arrivals-title">New arrivals</h2></div><Link href="/shop?sort=newest" className="gold-link">View all pieces ↗</Link></div>
        <div className="product-grid arrival-grid">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      <section className="trend-section" aria-labelledby="trend-title"><div className="wrap"><div className="section-heading dark-heading"><div><p className="eyebrow">CURATED BY BGV</p><h2 id="trend-title">Trending now</h2></div></div><div className="trend-grid"><Link href="/shop?category=Tailoring" className="trend-card trend-wide"><img src="/images/men.png" alt="BGV tailoring edit" /><span>Sharp lines / soft power <b>↗</b></span></Link><Link href="/shop?category=Dresses" className="trend-card"><img src="/images/women.png" alt="BGV dresses edit" /><span>After dark <b>↗</b></span></Link><Link href="/shop?category=Streetwear" className="trend-card"><img src="/images/hero.png" alt="BGV streetwear edit" /><span>New frequency <b>↗</b></span></Link></div></div></section>

      <section className="home-section category-section wrap" aria-labelledby="category-title"><div className="section-heading dark-heading"><div><p className="eyebrow">FIND YOUR FREQUENCY</p><h2 id="category-title">Shop by category</h2></div><Link href="/shop" className="gold-link">Shop everything ↗</Link></div><div className="category-grid luxury-category-grid">{categories.map((category) => <Link key={category.name} href={`/shop?category=${category.name}`} className="luxury-category"><div className={`photo ${category.position}`}><img src={`/images/${category.image}`} alt={category.name} /></div><span>{category.name}<b>↗</b></span></Link>)}</div></section>

      <section className="exclusive-drop" aria-labelledby="drop-title"><img src="/images/hero.png" alt="BGV Exclusive Drop campaign" /><div className="drop-overlay" /><div className="drop-copy wrap"><p className="eyebrow gold-eyebrow">BGV EXCLUSIVE / 002</p><h2 id="drop-title">The night<br /><em>shift.</em></h2><p>Limited silhouettes. Singular energy.</p><div className="drop-details"><span>LIMITED STOCK</span><span>DROP CLOSES IN <strong>02 : 18 : 44</strong></span></div><Link href="/shop?featured=true" className="luxury-button gold-button">Shop the drop <span>↗</span></Link></div></section>

      <section className="home-section wrap product-split-section" aria-labelledby="recommend-title"><div className="section-heading dark-heading"><div><p className="eyebrow">SELECTED FOR YOU</p><h2 id="recommend-title">Recommended for you</h2></div><span className="section-note">From the BGV collection</span></div><div className="product-grid">{products.slice(4, 8).map((product) => <ProductCard key={product.id} product={product} />)}</div></section>

      <section className="lookbook-section wrap" aria-labelledby="lookbook-title"><div className="lookbook-intro"><p className="eyebrow">THE BGV LOOKBOOK</p><h2 id="lookbook-title">Made for<br /><em>your main character.</em></h2><p>Architecture for a life in motion. Layered, precise, and always unmistakably yours.</p><Link href="/about" className="gold-link">Enter the world of BGV ↗</Link></div><div className="lookbook-images"><div className="lookbook-image tall"><img src="/images/women.png" alt="BGV womenswear lookbook" /></div><div className="lookbook-image small"><img src="/images/men.png" alt="BGV menswear lookbook" /></div><span className="gold-rule" /></div></section>

      <section className="home-section wrap" aria-labelledby="best-title"><div className="section-heading dark-heading"><div><p className="eyebrow">MOST WANTED</p><h2 id="best-title">Best sellers</h2></div><Link href="/shop?sort=popular" className="gold-link">See the edit ↗</Link></div><div className="product-grid">{(bestSellers.length ? bestSellers : products.slice(0, 4)).map((product) => <ProductCard key={product.id} product={product} />)}</div></section>

      <section className="service-section" aria-label="BGV services"><div className="wrap service-grid">{services.map(([number, title, text]) => <div className="service-item" key={title}><span>{number}</span><h3>{title}</h3><p>{text}</p></div>)}</div></section>
      <section className="newsletter-section wrap"><div><p className="eyebrow">THE INNER CIRCLE</p><h2>Stay in the frequency.</h2></div><form className="newsletter-form"><label htmlFor="newsletter-email">Email address</label><div><input id="newsletter-email" type="email" placeholder="your@email.com" required /><button type="submit" aria-label="Join the BGV newsletter">Join ↗</button></div></form></section>
    </div>
  );
}
