"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";

function ShopContent() {
  const searchParams = useSearchParams();
  const initialDepartment = searchParams.get("department") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialSearch = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState(initialDepartment);
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState("new");

  useEffect(() => {
    setDepartment(searchParams.get("department") || "");
    setCategory(searchParams.get("category") || "");
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    async function fetchCatalogue() {
      try {
        setLoading(true);
        const res = await fetch("/api/products");
        const json = await res.json();
        if (json.success && json.data?.products) {
          setProducts(json.data.products);
        }
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalogue();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["All categories", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (department && ["Women", "Men"].includes(department)) {
      list = list.filter((p) => p.department.toLowerCase() === department.toLowerCase());
    }

    if (category && category !== "All categories") {
      list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (sort === "low") {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === "high") {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, department, category, search, sort]);

  const pageTitle = search
    ? `Search: “${search}”`
    : department
    ? `${department}’s Collection`
    : category && category !== "All categories"
    ? `${category} Collection`
    : "The Collection.";

  return (
    <div className="wrap" style={{ paddingBottom: "70px" }}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Shop</span>
        {department && (
          <>
            <span>/</span>
            <span>{department}</span>
          </>
        )}
      </nav>

      <header className="page-head">
        <p className="eyebrow">THE BGV WARDROBE</p>
        <h1 className="page-title">{pageTitle}</h1>
        <p className="page-intro">Find a new favourite piece. Make it your own with effortless elegance.</p>

        <nav className="chips" aria-label="Department filter">
          <button
            type="button"
            className={`chip ${department === "" ? "active" : ""}`}
            onClick={() => setDepartment("")}
          >
            All Pieces
          </button>
          <button
            type="button"
            className={`chip ${department === "Women" ? "active" : ""}`}
            onClick={() => setDepartment("Women")}
          >
            Women
          </button>
          <button
            type="button"
            className={`chip ${department === "Men" ? "active" : ""}`}
            onClick={() => setDepartment("Men")}
          >
            Men
          </button>
        </nav>
      </header>

      <div className="toolbar">
        <p className="result-count">
          {filteredProducts.length} {filteredProducts.length === 1 ? "piece" : "pieces"}
        </p>

        <label className="field">
          <span>Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c === "All categories" ? "" : c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="new">Featured</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="empty-state">
          <h2>Loading collection...</h2>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No matches found.</h2>
          <p>Try refining your search terms or explore all categories.</p>
          <button
            type="button"
            className="button"
            onClick={() => {
              setDepartment("");
              setCategory("");
              setSearch("");
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="wrap" style={{ padding: "60px 0" }}><h2>Loading catalogue...</h2></div>}>
      <ShopContent />
    </Suspense>
  );
}
