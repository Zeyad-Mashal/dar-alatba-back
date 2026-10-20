"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import "./ShopContent.css";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function getApiData(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "تعذر تحميل بيانات المتجر");
  }
  return payload.data || [];
}

export default function ServerShopContent() {
  const { addToCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const updateSearchQuery = (value) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    const queryString = params.toString();
    router.replace(queryString ? `/shop?${queryString}` : "/shop", { scroll: false });
  };

  useEffect(() => {
    let isCancelled = false;

    Promise.all([
      getApiData("/getAllProducts"),
      getApiData("/getAllCategories")
    ])
      .then(([productsData, categoriesData]) => {
        if (isCancelled) return;

        const activeCategories = visibleCategories(categoriesData);
        const activeProducts = productsData.filter(
          (product) =>
            product.isActive !== false &&
            productInCategory(product, "all", activeCategories) &&
            activeCategories.some((category) =>
              productInCategory(product, category._id, activeCategories)
            )
        );
        const highestPrice = activeProducts.length
          ? Math.max(...activeProducts.map((product) => Number(product.price) || 0))
          : 0;

        setCategories(activeCategories);
        setProducts(activeProducts);
        setMaxPrice(highestPrice);
        setError("");
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

  const priceLimits = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 };
    const prices = products.map((product) => Number(product.price) || 0);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      if (!productInCategory(product, selectedCategory, categories)) {
        return false;
      }
      if (
        normalizedSearch &&
        !product.name?.toLowerCase().includes(normalizedSearch) &&
        !product.nameEn?.toLowerCase().includes(normalizedSearch) &&
        !product.title?.toLowerCase().includes(normalizedSearch) &&
        !product.description?.toLowerCase().includes(normalizedSearch) &&
        !product.descriptionEn?.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }
      return Number(product.price) <= maxPrice;
    });
  }, [products, categories, selectedCategory, searchQuery, maxPrice]);

  const countCategoryProducts = (categoryId) =>
    countProductsInCategory(products, categoryId, categories);

  const mainCategories = categories.filter(isMainCategory);

  const clearFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setMaxPrice(priceLimits.max);
    router.replace("/shop", { scroll: false });
  };

  return (
    <div className="shop-page-wrapper pattern-bg">
      <header className="shop-page-header">
        <div className="header-decorations">
          <div className="decor-circle circle-1" />
          <div className="decor-circle circle-2" />
        </div>
        <div className="header-text-container">
          <h1 className="shop-header-title">متجر دار الأطباء</h1>
          <p className="shop-header-subtitle">
            تصفح جميع منتجاتنا واختر القسم المناسب لك
          </p>
        </div>
      </header>

      <div className="shop-content-container">
        <aside className="shop-sidebar-filters">
          <div className="filter-box">
            <h3 className="filter-box-title">البحث عن منتج</h3>
            <div className="search-input-wrapper">
              <input
                type="search"
                placeholder="ابحث باسم المنتج..."
                value={searchQuery}
                onChange={(event) => updateSearchQuery(event.target.value)}
                className="shop-search-input"
              />
              <svg className="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="filter-box">
            <h3 className="filter-box-title">الأقسام</h3>
            <div className="subcategory-options">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`subcat-btn ${selectedCategory === "all" ? "active" : ""}`}
              >
                <span>كل المنتجات</span>
                <span className="count-num">({products.length})</span>
              </button>
              {mainCategories.map((category) => {
                const subs = categories.filter(
                  (item) => parentIdOf(item) === category._id
                );
                return (
                  <div key={category._id} className="shop-category-group">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(category._id)}
                      className={`subcat-btn ${selectedCategory === category._id ? "active" : ""}`}
                    >
                      <span>{categoryName(category)}</span>
                      <span className="count-num">
                        ({countCategoryProducts(category._id)})
                      </span>
                    </button>
                    {subs.map((sub) => (
                      <button
                        type="button"
                        key={sub._id}
                        onClick={() => setSelectedCategory(sub._id)}
                        className={`subcat-btn subcat-child ${selectedCategory === sub._id ? "active" : ""}`}
                      >
                        <span>{categoryName(sub)}</span>
                        <span className="count-num">
                          ({countCategoryProducts(sub._id)})
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {priceLimits.max > 0 && (
            <div className="filter-box">
              <h3 className="filter-box-title">تصفية بالسعر</h3>
              <div className="price-slider-wrapper">
                <input
                  type="range"
                  min={priceLimits.min}
                  max={priceLimits.max}
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="price-range-slider"
                />
                <div className="price-labels">
                  <span>حتى <strong className="text-gold">{maxPrice} ج.م</strong></span>
                  <span>من {priceLimits.min} ج.م</span>
                </div>
              </div>
            </div>
          )}

          {(selectedCategory !== "all" ||
            searchQuery ||
            maxPrice < priceLimits.max) && (
            <button type="button" onClick={clearFilters} className="clear-all-filters-btn">
              إعادة تعيين الفلاتر
            </button>
          )}
        </aside>

        <main className="shop-products-main">
          <div className="shop-categories-tabs-bar server-shop-tabs">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`shop-tab-btn ${selectedCategory === "all" ? "active" : ""}`}
            >
              الكل
            </button>
            {mainCategories.map((category) => (
              <button
                type="button"
                key={category._id}
                onClick={() => setSelectedCategory(category._id)}
                className={`shop-tab-btn ${selectedCategory === category._id ? "active" : ""}`}
              >
                {categoryName(category)}
              </button>
            ))}
          </div>

          <div className="shop-info-row">
            <span className="products-found-count">
              تم العثور على <strong>{filteredProducts.length}</strong> منتج
            </span>
          </div>

          {isLoading ? (
            <div className="server-shop-state">
              <div className="spinner-loader" />
              <p>جاري تحميل منتجات المتجر...</p>
            </div>
          ) : error ? (
            <div className="shop-no-results">
              <h3>تعذر تحميل المتجر</h3>
              <p>{error}</p>
              <button type="button" onClick={() => window.location.reload()} className="reset-filters-inline-btn">
                إعادة المحاولة
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="shop-no-results">
              <h3>لا توجد منتجات مطابقة</h3>
              <p>جرّب اختيار قسم آخر أو إعادة تعيين الفلاتر.</p>
              <button type="button" onClick={clearFilters} className="reset-filters-inline-btn">
                عرض كل المنتجات
              </button>
            </div>
          ) : (
            <div className="shop-products-grid">
              {filteredProducts.map((product) => {
                const image = product.images?.[0]?.url || "/images/logo.jpeg";
                const productCategoryName =
                  product.categoryPath ||
                  (typeof product.category === "object"
                    ? product.category?.name
                    : categories.find((category) => category._id === product.category)?.name);
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
                        <Link href={`/product/${product._id}`} className="text-decoration-none">
                          {product.name}
                        </Link>
                      </h3>
                      <p className="product-card-desc">{product.description}</p>
                      <div className="product-card-bottom-row">
                        <div className="price-container">
                          <span className="current-price">{product.price} ج.م</span>
                          <small className="server-product-stock">
                            متاح: {product.stock ?? 0}
                          </small>
                        </div>
                        {needsVariant ? (
                          <Link href={`/product/${product._id}`} className="product-card-add-to-cart-btn">
                            <span>اختر المقاس واللون</span>
                          </Link>
                        ) : (
                        <button
                          type="button"
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
                          className="product-card-add-to-cart-btn"
                          disabled={(product.stock ?? 0) <= 0}
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
        </main>
      </div>
    </div>
  );
}
