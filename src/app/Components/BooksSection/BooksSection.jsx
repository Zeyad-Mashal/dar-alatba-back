"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import {
  buildCartItem,
  categoryName,
  countProductsInCategory,
  isMainCategory,
  parentIdOf,
  productHasVariants,
  productInCategory,
  visibleCategories,
} from "../../lib/catalogClient";
import "../ShopContent/ShopContent.css";
import "./BooksSection.css";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function getApiData(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "تعذر تحميل المنتجات");
  return payload.data || [];
}

export default function BooksSection() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    let isCancelled = false;

    Promise.all([
      getApiData("/getAllProducts"),
      getApiData("/getAllCategories")
    ])
      .then(([productsData, categoriesData]) => {
        if (isCancelled) return;

        const activeCategories = visibleCategories(categoriesData);
        setCategories(activeCategories);
        setProducts(
          productsData.filter(
            (product) =>
              product.isActive !== false &&
              activeCategories.some((category) =>
                productInCategory(product, category._id, activeCategories)
              )
          )
        );
      })
      .catch((requestError) => {
        if (!isCancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const displayedProducts = useMemo(() => {
    const filtered = products.filter((product) =>
      productInCategory(product, selectedCategory, categories)
    );
    return filtered.slice(0, 8);
  }, [products, selectedCategory, categories]);

  const categoryProductCount = (categoryId) =>
    countProductsInCategory(products, categoryId, categories);
  const mainCategories = categories.filter(isMainCategory);

  return (
    <section id="books-section" className="books-section-container pattern-bg">
      <div className="books-section-wrapper">
        <div className="books-header">
          <div className="section-title-wrapper">
            <h2 className="books-section-title">مكتبة دار الأطباء الإسلامية</h2>
          </div>
          <p className="books-section-subtitle">
            أحدث منتجات المتجر من جميع الأقسام، اختر القسم المناسب لتصفية المنتجات
          </p>
        </div>

        <div className="categories-filter-bar">
          <button
            type="button"
            className={`category-tab-btn ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            الكل ({products.length})
          </button>
          {mainCategories.map((category) => (
            <button
              type="button"
              key={category._id}
              className={`category-tab-btn ${selectedCategory === category._id ? "active" : ""}`}
              onClick={() => setSelectedCategory(category._id)}
            >
              {categoryName(category)} ({categoryProductCount(category._id)})
            </button>
          ))}
          {categories
            .filter((category) => parentIdOf(category))
            .map((category) => (
              <button
                type="button"
                key={category._id}
                className={`category-tab-btn ${selectedCategory === category._id ? "active" : ""}`}
                onClick={() => setSelectedCategory(category._id)}
              >
                {categoryName(category)} ({categoryProductCount(category._id)})
              </button>
            ))}
        </div>

        {isLoading ? (
          <div className="home-products-state">
            <div className="spinner-loader" />
            <p>جاري تحميل المنتجات...</p>
          </div>
        ) : error ? (
          <div className="home-products-state error">
            <p>{error}</p>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="home-products-state">
            <p>لا توجد منتجات في هذا القسم حالياً.</p>
          </div>
        ) : (
          <div className="shop-products-grid">
            {displayedProducts.map((product) => {
              const image = product.images?.[0]?.url || "/images/logo.jpeg";
              const productCategoryName =
                product.categoryPath ||
                (typeof product.category === "object"
                  ? product.category?.name
                  : categories.find(
                      (category) => category._id === product.category
                    )?.name);
              const needsVariant = productHasVariants(product);

              return (
                <article key={product._id} className="shop-product-card">
                  <div className="product-card-image-holder">
                    <Link href={`/product/${product._id}`}>
                      <img
                        src={image}
                        alt={product.name}
                        className="product-card-img"
                      />
                    </Link>
                      <div className="product-card-hover-actions">
                        <Link
                          href={`/product/${product._id}`}
                          className="product-card-quick-wa-btn server-details-btn"
                        >
                          تفاصيل المنتج
                        </Link>
                      </div>
                  </div>

                  <div className="product-card-info">
                    <span className="product-card-subcategory">{productCategoryName}</span>
                    <h3 className="product-card-title">
                      <Link
                        href={`/product/${product._id}`}
                        className="text-decoration-none"
                      >
                        {product.name}
                      </Link>
                    </h3>
                    <p className="product-card-desc">{product.description}</p>

                    <div className="product-card-bottom-row">
                      <div className="price-container">
                        <span className="current-price">{product.price} ج.م</span>
                      </div>
                      {needsVariant ? (
                        <Link href={`/product/${product._id}`} className="product-card-add-to-cart-btn">
                          اختر المقاس واللون
                        </Link>
                      ) : (
                      <button
                        type="button"
                        className="product-card-add-to-cart-btn"
                        onClick={() =>
                          addToCart(
                            buildCartItem({
                              productId: product._id,
                              name: product.name,
                              image,
                              price: Number(product.price),
                            })
                          )
                        }
                        disabled={(product.stock ?? 0) <= 0}
                        aria-label="أضف إلى السلة"
                      >
                        <svg className="cart-btn-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>أضف للسلة</span>
                      </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="home-products-view-all">
          <Link href="/shop" className="home-view-all-btn">
            عرض الكل
          </Link>
        </div>
      </div>
    </section>
  );
}
