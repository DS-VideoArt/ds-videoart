"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/catalog";

export function Catalog({ products, categories, title }: { products: Product[]; categories: string[]; title: string }) {
  const [activeCategory, setActiveCategory] = useState("הכל");
  const [query, setQuery] = useState("");

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = activeCategory === "הכל" || product.category === activeCategory;
    const haystack = `${product.name} ${product.useCase} ${product.specs.join(" ")}`.toLowerCase();
    return matchesCategory && haystack.includes(query.trim().toLowerCase());
  }), [activeCategory, products, query]);

  const clearFilters = () => {
    setActiveCategory("הכל");
    setQuery("");
  };

  return (
    <section className="section catalog-section" aria-labelledby="catalog-title">
      <div className="container">
        <div className="catalog-heading">
          <div>
            <span className="eyebrow">בחירה שמתאימה לכם</span>
            <h2 id="catalog-title">{title}</h2>
          </div>
          <label className="search-box">
            <span className="sr-only">חיפוש בקטלוג</span>
            <Search aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="חיפוש לפי שם או מפרט" type="search" />
          </label>
        </div>
        <div className="catalog-toolbar">
          <div className="filter-label"><SlidersHorizontal aria-hidden="true" /> סינון</div>
          <div className="filter-buttons" aria-label="סינון לפי קטגוריה">
            {["הכל", ...categories].map((category) => (
              <button key={category} type="button" aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)}>
                {category}
              </button>
            ))}
          </div>
          <p className="result-count" aria-live="polite">{visibleProducts.length} פריטים נמצאו</p>
        </div>
        {visibleProducts.length ? (
          <div className="product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        ) : (
          <div className="empty-state card">
            <Search aria-hidden="true" />
            <h3>לא מצאנו התאמה מדויקת</h3>
            <p>אפשר לנקות את הסינון או לדבר איתנו ונאתר עבורכם פתרון מתאים.</p>
            <button className="button button-ghost" type="button" onClick={clearFilters}>ניקוי הסינון</button>
          </div>
        )}
      </div>
    </section>
  );
}
