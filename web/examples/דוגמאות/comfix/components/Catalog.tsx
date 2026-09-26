import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/catalog";

/* Static catalog: products are listed per category, without search or filtering.
   A searchable / filterable catalog is custom scope and not part of the basic business site package. */
export function Catalog({ products, categories, title }: { products: Product[]; categories: string[]; title: string }) {
  const groups = categories.map((category) => ({ category, items: products.filter((product) => product.category === category) })).filter((group) => group.items.length);

  return (
    <section className="section catalog-section" aria-labelledby="catalog-title">
      <div className="container">
        <div className="catalog-heading">
          <div>
            <span className="eyebrow">בחירה שמתאימה לכם</span>
            <h2 id="catalog-title">{title}</h2>
          </div>
          <p className="catalog-note">המוצרים, המפרטים והמחירים מוצגים להמחשה בלבד.</p>
        </div>
        {groups.length > 1 ? groups.map((group) => (
          <div className="catalog-group" key={group.category}>
            <h3 className="catalog-group-title">{group.category}</h3>
            <div className="product-grid">{group.items.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          </div>
        )) : (
          <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        )}
      </div>
    </section>
  );
}
