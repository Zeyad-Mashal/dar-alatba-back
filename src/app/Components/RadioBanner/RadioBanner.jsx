"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import "./RadioBanner.css";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "";

const FEATURED_PRODUCT_ID = "6a7aa68a29a5604e84549f8a";
const FEATURED_PRODUCT_NAME = "مصحف معلم التجويد المفسر مقاس 20*28";

function pickFeaturedMushaf(products) {
  const activeProducts = products.filter((product) => product.isActive !== false);

  return (
    activeProducts.find((product) => product._id === FEATURED_PRODUCT_ID) ||
    activeProducts.find((product) =>
      (product.name || "").includes("مصحف معلم التجويد المفسر مقاس 20")
    ) ||
    activeProducts.find((product) =>
      (product.name || "").includes("مصحف معلم التجويد المفسر")
    ) ||
    null
  );
}

export default function RadioBanner() {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    let isCancelled = false;

    fetch(`${API_BASE_URL}/getAllProducts`, {
      headers: { Accept: "application/json" }
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || "تعذر تحميل المنتجات");
        return payload.data || [];
      })
      .then((products) => {
        if (isCancelled) return;
        setProduct(pickFeaturedMushaf(products));
      })
      .catch(() => {
        if (!isCancelled) setProduct(null);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <section id="radio-section" className="radio-banner-section">
        <div className="radio-banner-container radio-banner-loading">
          <div className="spinner-loader" />
          <p>جاري تحميل المصحف المميز...</p>
        </div>
      </section>
    );
  }

  if (!product) return null;

  const image = product.images?.[0]?.url || "/images/logo.jpeg";
  const title = product.name || FEATURED_PRODUCT_NAME;
  const description =
    product.description ||
    "مصحف تعليمي يجمع بين تلاوة القرآن وأحكام التجويد وتفسير الآيات مع كيو آر كود للمحتوى الإضافي.";
  const price = Number(product.price) || 0;
  const shortDescription =
    description.length > 220 ? `${description.slice(0, 220).trim()}...` : description;

  return (
    <section id="radio-section" className="radio-banner-section">
      <div className="radio-bg-decorations">
        <div className="radio-ornament ornament-right"></div>
        <div className="radio-ornament ornament-left"></div>
      </div>

      <div className="radio-banner-container">
        <div className="radio-image-side">
          <div className="radio-frame-glow-effect"></div>
          <div className="radio-img-container">
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 450px"
              className="radio-product-img"
              unoptimized={image.startsWith("http")}
            />
          </div>
        </div>

        <div className="radio-details-side">
          <div className="badge-featured-radio">منتج مميز</div>
          <h2 className="radio-section-title">{title}</h2>
          <p className="radio-section-tagline">
            تعلّم التجويد وافهم معاني الآيات في مصحف واحد بمقاس 20×28
          </p>

          <p className="radio-section-description">{shortDescription}</p>

          <ul className="radio-features-list">
            <li>
              <strong>أحكام التجويد:</strong> توضيح أحكام التلاوة أثناء القراءة بطريقة سهلة وعملية.
            </li>
            <li>
              <strong>تفسير الآيات:</strong> بيان وشرح معاني الآيات بما يعين على التدبر والفهم.
            </li>
            <li>
              <strong>كيو آر كود:</strong> وصول سريع لمحتوى إضافي صوتي وتعليمي عبر الهاتف.
            </li>
          </ul>

          <div className="radio-actions">
            <button
              type="button"
              className="btn-order-radio cursor-pointer border-none"
              onClick={() =>
                addToCart({
                  id: product._id,
                  title,
                  image,
                  price
                })
              }
            >
              <span>أضف للسلة</span>
              <span className="price-tag">{price} ج.م</span>
            </button>

            <Link href={`/product/${product._id}`} className="btn-demo-radio radio-details-link">
              تفاصيل المنتج
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
