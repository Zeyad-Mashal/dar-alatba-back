"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import "./ShopContent.css";

const subcategoryNames = {
  tafseer: "القرآن والتفسير",
  seerah: "السيرة والتاريخ",
  hadeeth: "الحديث الشريف",
  fiqh: "الفقه والعقيدة",
  kids: "كتب الأطفال",
  general: "كتب عامة ورقائق"
};

export default function ShopContent({ defaultCategory = "books" }) {
  const { addToCart, productsList: products } = useCart();
  const [activeTab, setActiveTab] = useState(defaultCategory); // 'books', 'radios', 'offers'
  const [searchQuery, setSearchQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");

  // Reset subcategory filter when switching tabs
  useEffect(() => {
    setSelectedSubcategory("all");
  }, [activeTab]);

  // Sync active tab with defaultCategory prop if it changes
  useEffect(() => {
    setActiveTab(defaultCategory);
  }, [defaultCategory]);

  // Find min and max price ranges in products to set default limits
  const priceLimits = useMemo(() => {
    if (!products || products.length === 0) return { min: 0, max: 1000 };
    const prices = products.map((p) => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }, [products]);

  // Sync maxPrice when products list loads
  useEffect(() => {
    if (priceLimits.max > 0) {
      setMaxPrice(priceLimits.max);
    }
  }, [priceLimits]);

  // Filter products based on active tab, search query, price limit, and subcategory
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((product) => {
      // 1. Category check
      if (product.category !== activeTab) return false;

      // 2. Search query check
      if (
        searchQuery &&
        !product.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ) {
        return false;
      }

      // 3. Price check
      if (product.price > maxPrice) return false;

      // 4. Subcategory check (only applicable for books)
      if (
        activeTab === "books" &&
        selectedSubcategory !== "all" &&
        product.subcategory !== selectedSubcategory
      ) {
        return false;
      }

      return true;
    });
  }, [products, activeTab, searchQuery, maxPrice, selectedSubcategory]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setMaxPrice(priceLimits.max);
    setSelectedSubcategory("all");
  };

  return (
    <div className="shop-page-wrapper pattern-bg">
      {/* Page Header */}
      <header className="shop-page-header">
        <div className="header-decorations">
          <div className="decor-circle circle-1"></div>
          <div className="decor-circle circle-2"></div>
        </div>
        <div className="header-text-container">
          <h1 className="shop-header-title">
            {activeTab === "books" && "مكتبة الكتب الإسلامية"}
            {activeTab === "radios" && "راديو دار الأطباء التراثي"}
            {activeTab === "offers" && "عروض التوفير الحصرية"}
          </h1>
          <p className="shop-header-subtitle">
            {activeTab === "books" && "تصفح واقتني أمهات الكتب والمراجع الدينية والقصص الإسلامية"}
            {activeTab === "radios" && "استمع للتلاوات المباركة وأثير الإذاعات عبر الراديو المصنوع يدوياً"}
            {activeTab === "offers" && "وفر أكثر مع الباقات الحصرية والمجموعات المنسقة بأقل الأسعار"}
          </p>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="shop-content-container">
        {/* Sidebar Filters */}
        <aside className="shop-sidebar-filters">
          <div className="filter-box">
            <h3 className="filter-box-title">البحث عن منتج</h3>
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="ابحث بالاسم أو الوصف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="shop-search-input"
              />
              <svg className="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="filter-box">
            <h3 className="filter-box-title">تصفية بالسعر</h3>
            <div className="price-slider-wrapper">
              <input
                type="range"
                min={priceLimits.min}
                max={priceLimits.max}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="price-range-slider"
              />
              <div className="price-labels">
                <span>الحد الأقصى: <strong className="text-gold">{maxPrice} ج.م</strong></span>
                <span>الحد الأدنى: <strong>{priceLimits.min} ج.م</strong></span>
              </div>
            </div>
          </div>

          {/* Subcategories (Only for Books category) */}
          {activeTab === "books" && (
            <div className="filter-box">
              <h3 className="filter-box-title">أقسام الكتب</h3>
              <div className="subcategory-options">
                <button
                  onClick={() => setSelectedSubcategory("all")}
                  className={`subcat-btn ${selectedSubcategory === "all" ? "active" : ""}`}
                >
                  <span>كل الكتب</span>
                  <span className="count-dot"></span>
                </button>
                {Object.entries(subcategoryNames).map(([key, name]) => {
                  const count = products.filter((p) => p.category === "books" && p.subcategory === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedSubcategory(key)}
                      className={`subcat-btn ${selectedSubcategory === key ? "active" : ""}`}
                    >
                      <span>{name}</span>
                      <span className="count-num">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(searchQuery || maxPrice < priceLimits.max || selectedSubcategory !== "all") && (
            <button onClick={handleClearFilters} className="clear-all-filters-btn">
              إعادة تعيين الفلاتر
            </button>
          )}
        </aside>

        {/* Products Display Area */}
        <main className="shop-products-main">
          {/* Tabs bar */}
          <div className="shop-categories-tabs-bar">
            <button
              onClick={() => setActiveTab("books")}
              className={`shop-tab-btn ${activeTab === "books" ? "active" : ""}`}
            >
              مكتبة الكتب
            </button>
            <button
              onClick={() => setActiveTab("radios")}
              className={`shop-tab-btn ${activeTab === "radios" ? "active" : ""}`}
            >
              راديو الأطباء
            </button>
            <button
              onClick={() => setActiveTab("offers")}
              className={`shop-tab-btn ${activeTab === "offers" ? "active" : ""}`}
            >
              العروض الخاصة
            </button>
          </div>

          {/* Info row */}
          <div className="shop-info-row">
            <span className="products-found-count">
              تم العثور على <strong>{filteredProducts.length}</strong> منتج
            </span>
          </div>

          {/* Grid */}
          {filteredProducts.length === 0 ? (
            <div className="shop-no-results">
              <svg className="no-results-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3>لم نجد أي نتائج تطابق فلاتر البحث</h3>
              <p>حاول تغيير المعايير أو الكلمات المفتاحية في البحث، أو تصفير حدود الأسعار.</p>
              <button onClick={handleClearFilters} className="reset-filters-inline-btn">
                تصفية البحث
              </button>
            </div>
          ) : (
            <div className="shop-products-grid">
              {filteredProducts.map((product) => {
                const discount = product.originalPrice ? product.originalPrice - product.price : 0;
                
                return (
                  <div key={product.id} className="shop-product-card">
                    <div className="product-card-image-holder">
                      <Link href={`/product/${product.id}`}>
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                          className="product-card-img"
                        />
                      </Link>
                      {discount > 0 && (
                        <div className="discount-badge">
                          وفر {discount} ج.م
                        </div>
                      )}
                      <div className="product-card-hover-actions flex flex-col gap-2 p-4">
                        <Link
                          href={`/product/${product.id}`}
                          className="product-card-quick-wa-btn text-center text-decoration-none"
                          style={{ backgroundColor: "#0f3b2e", color: "#ebdcb9", border: "1px solid #ebdcb9" }}
                        >
                          تفاصيل المنتج
                        </Link>
                      </div>
                    </div>

                    <div className="product-card-info">
                      {product.subcategory && (
                        <span className="product-card-subcategory">
                          {subcategoryNames[product.subcategory]}
                        </span>
                      )}
                      <h3 className="product-card-title">
                        <Link href={`/product/${product.id}`} className="hover:text-[#c5a880] transition duration-200 text-decoration-none text-brand-emerald">
                          {product.title}
                        </Link>
                      </h3>
                      <p className="product-card-desc">{product.description}</p>
                      
                      <div className="product-card-bottom-row">
                        <div className="price-container">
                          <span className="current-price">{product.price} ج.م</span>
                          {product.originalPrice && (
                            <span className="original-price">{product.originalPrice} ج.م</span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => addToCart({
                            id: product.id,
                            title: product.title,
                            image: product.image,
                            price: product.price
                          })}
                          className="product-card-add-to-cart-btn"
                          aria-label="أضف إلى السلة"
                        >
                          <svg className="cart-btn-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>أضف للسلة</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
