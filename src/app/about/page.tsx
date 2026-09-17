import React from "react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="wrap">
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>About BGV</span>
      </div>

      <article className="content-page">
        <p className="eyebrow">THE BGV POINT OF VIEW</p>
        <h1 className="page-title">Dress for yourself.</h1>
        <p>
          Relaxed streetwear. A tailored, dressed-up moment. The everyday piece you reach for again and again.
          BGV is built around one enduring philosophy: making room for your own distinct style and self-expression.
        </p>

        <h2>Different styles. Same energy.</h2>
        <p>
          Our collections bring women’s and men’s contemporary fashion into one seamless destination. Each garment
          is designed with clean architectural lines, premium breathable fabrics, and rich, distinctive color palettes.
        </p>

        <h2>Sustainable Craft & Quality</h2>
        <p>
          We believe in pieces that outlive fleeting trends. From high-density heavyweight jerseys to structured
          denim and tailored coords, we partner with ethical artisans to ensure longevity in every stitch.
        </p>

        <div style={{ marginTop: "40px" }}>
          <Link href="/shop" className="button coral">
            Explore the Collection <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </article>
    </div>
  );
}
