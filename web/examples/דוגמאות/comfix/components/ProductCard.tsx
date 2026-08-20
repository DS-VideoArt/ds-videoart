import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import type { Product } from "@/lib/catalog";

const priceFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card card">
      <div className="product-image">
        <img src={product.image} alt={`${product.name}, ${product.useCase}`} width="640" height="420" loading="lazy" />
        {product.badge ? <span className="product-badge">{product.badge}</span> : null}
      </div>
      <div className="product-content">
        <span className="product-category">{product.category} · {product.useCase}</span>
        <h3>{product.name}</h3>
        <strong className="product-price">{priceFormatter.format(product.price)}</strong>
        <ul className="spec-list">
          {product.specs.slice(0, 3).map((spec) => <li key={spec}><CheckCircle2 aria-hidden="true" /> {spec}</li>)}
        </ul>
        <div className="warranty"><ShieldCheck aria-hidden="true" /> {product.warranty}</div>
        <a className="product-link" href={`/contact?product=${encodeURIComponent(product.name)}`}>
          קבלת הצעה <ArrowLeft aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
