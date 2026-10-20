"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { buildCartItem, findVariant, optionLabel } from "../../lib/catalogClient";
import { SHIPPING_FEE } from "../../lib/shipping";
import "./ProductDetails.css";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function ProductDetails({ productId }) {
  const { addToCart, setIsCartOpen } = useCart();
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedSizeId, setSelectedSizeId] = useState("");
  const [selectedColorId, setSelectedColorId] = useState("");
  const [activeInfoTab, setActiveInfoTab] = useState("description"); // 'description', 'specs'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    if (productId) {
      fetch(`${API_BASE_URL}/getProductDetails/${productId}`, {
        headers: { Accept: "application/json" }
      })
        .then(async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.message || "Product not found");
          return payload.data;
        })
        .then((serverProduct) => {
          if (isCancelled) return;

          const gallery = (serverProduct.images || []).map((image) => image.url);
          const normalizedProduct = {
            id: serverProduct._id,
            title: serverProduct.nameAr || serverProduct.name,
            titleEn: serverProduct.nameEn || "",
            description: serverProduct.descriptionAr || serverProduct.description,
            descriptionEn: serverProduct.descriptionEn || "",
            longDescription: serverProduct.descriptionAr || serverProduct.description,
            price: Number(serverProduct.price),
            stock: serverProduct.stock ?? 0,
            image: gallery[0] || "/images/logo.jpeg",
            gallery,
            categoryName:
              serverProduct.categoryPath ||
              (typeof serverProduct.category === "object"
                ? serverProduct.category?.name
                : "منتجات المتجر"),
            colors: serverProduct.colors || [],
            sizes: serverProduct.sizes || [],
            variants: serverProduct.variants || [],
            rating: 5,
            specifications: {
              القسم:
                serverProduct.categoryPath ||
                (typeof serverProduct.category === "object"
                  ? serverProduct.category?.name
                  : "منتجات المتجر"),
              "الكمية المتاحة": serverProduct.stock ?? 0,
              الألوان: (serverProduct.colors || []).map(optionLabel).join("، ") || "—",
              المقاسات: (serverProduct.sizes || []).map(optionLabel).join("، ") || "—",
            }
          };
          setProduct(normalizedProduct);
          setSelectedSizeId(normalizedProduct.sizes[0]?._id || "");
          setSelectedColorId(normalizedProduct.colors[0]?._id || "");
          setActiveImage(normalizedProduct.image);
          setQuantity(1);
        })
        .catch(() => {
          if (!isCancelled) setProduct(null);
        })
        .finally(() => {
          if (!isCancelled) setIsLoading(false);
        });
    } else {
      Promise.resolve().then(() => setIsLoading(false));
    }

    return () => {
      isCancelled = true;
    };
  }, [productId]);

  if (isLoading) {
    return (
      <div className="product-not-found-container pattern-bg">
        <div className="not-found-card">
          <div className="spinner-loader" />
          <p>جاري تحميل تفاصيل المنتج...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-not-found-container pattern-bg">
        <div className="not-found-card">
          <svg className="not-found-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2>المنتج غير متوفر حالياً</h2>
          <p>معذرة، لم نتمكن من العثور على هذا المنتج في متجرنا. قد يكون تم إزالته أو تغيير معرفه.</p>
          <Link href="/shop" className="back-to-shop-btn">
            العودة للمتجر
          </Link>
        </div>
      </div>
    );
  }

  const needsVariant = Boolean(product?.sizes?.length || product?.colors?.length);
  const availableStock = !product
    ? 0
    : needsVariant
      ? (findVariant(product, selectedSizeId, selectedColorId)?.stock ?? 0)
      : (product.stock ?? 0);

  const handleQuantityChange = (val) => {
    if (val < 1 || val > availableStock) return;
    setQuantity(val);
  };

  const addSelectedToCart = () => {
    if (availableStock < 1 || quantity > availableStock) return;
    const size = product.sizes?.find((item) => item._id === selectedSizeId) || null;
    const color = product.colors?.find((item) => item._id === selectedColorId) || null;
    if ((product.sizes?.length && !size) || (product.colors?.length && !color)) return;
    addToCart(
      buildCartItem({
        productId: product.id,
        name: product.title,
        image: product.image,
        price: product.price,
        quantity,
        size,
        color,
      })
    );
  };

  const handleAddToCartClick = () => {
    addSelectedToCart();
  };

  const handleBuyNowClick = () => {
    addSelectedToCart();
    if (availableStock >= 1) setIsCartOpen(true);
  };

  const discount = product.originalPrice ? product.originalPrice - product.price : 0;

  return (
    <div className="product-details-page-wrapper pattern-bg">
      <div className="product-details-content-container">
        
        {/* Breadcrumbs */}
        <div className="shop-breadcrumbs">
          <Link href="/">الرئيسية</Link>
          <span className="crumb-separator">/</span>
          <Link href="/shop">المتجر</Link>
          <span className="crumb-separator">/</span>
          <span className="current-crumb">{product.title}</span>
        </div>

        {/* Top Section: Gallery & Details */}
        <div className="product-showcase-grid">
          
          {/* Right Column: Gallery */}
          <div className="product-gallery-side">
            <div className="main-image-display-frame">
              {discount > 0 && (
                <div className="product-detail-discount-badge">
                  وفر {discount} ج.م
                </div>
              )}
              <div className="main-image-container">
                <Image
                  src={activeImage}
                  alt={product.title}
                  fill
                  priority
                  className="product-main-img"
                />
              </div>
            </div>

            {/* Thumbnails Row */}
            {product.gallery && product.gallery.length > 1 && (
              <div className="gallery-thumbnails-row">
                {product.gallery.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(img)}
                    className={`thumbnail-btn ${activeImage === img ? "active" : ""}`}
                  >
                    <Image
                      src={img}
                      alt={`${product.title} - ${index + 1}`}
                      width={70}
                      height={85}
                      className="thumbnail-img"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Left Column: Product Info & Actions */}
          <div className="product-info-actions-side">
            <span className="product-category-tag-badge">
              {product.categoryName}
            </span>

            <h1 className="product-detail-title">{product.title}</h1>
            {product.titleEn && <p className="product-detail-english-title" dir="ltr">{product.titleEn}</p>}
            
            <div className="product-rating-stars-row">
              <span className="detail-rating-stars">{"★".repeat(product.rating)}</span>
              <span className="rating-text-label">(تقييم 5 نجوم من العملاء)</span>
            </div>

            <div className="product-detail-price-box">
              <span className="detail-current-price">{product.price} ج.م</span>
              {product.originalPrice && (
                <span className="detail-original-price">{product.originalPrice} ج.م</span>
              )}
            </div>

            <p className="product-detail-short-desc">{product.description}</p>
            {product.descriptionEn && (
              <p className="product-detail-english-desc" dir="ltr">{product.descriptionEn}</p>
            )}

            {product.sizes?.length > 0 && (
              <div className="variant-picker">
                <span className="qty-select-label">المقاس</span>
                <div className="variant-options">
                  {product.sizes.map((size) => (
                    <button
                      type="button"
                      key={size._id}
                      className={`size-option-btn ${selectedSizeId === size._id ? "active" : ""}`}
                      onClick={() => {
                        setSelectedSizeId(size._id);
                        setQuantity(1);
                      }}
                    >
                      {optionLabel(size)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colors?.length > 0 && (
              <div className="variant-picker">
                <span className="qty-select-label">اللون</span>
                <div className="variant-options">
                  {product.colors.map((color) => (
                    <button
                      type="button"
                      key={color._id}
                      className={`color-option-btn ${selectedColorId === color._id ? "active" : ""}`}
                      onClick={() => {
                        setSelectedColorId(color._id);
                        setQuantity(1);
                      }}
                    >
                      <span className="color-swatch" style={{ background: color.hex || "#111" }} />
                      {optionLabel(color)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <p className="variant-stock-note">
              {availableStock > 0
                ? `المتوفر من هذا الاختيار: ${availableStock} قطعة`
                : "هذا الاختيار غير متوفر حالياً"}
            </p>

            <div className="quantity-selection-wrapper">
              <span className="qty-select-label">الكمية المطلوبة:</span>
              <div className="detail-qty-adjuster">
                <button onClick={() => handleQuantityChange(quantity + 1)} className="detail-qty-btn">
                  ＋
                </button>
                <span className="detail-qty-val">{quantity}</span>
                <button onClick={() => handleQuantityChange(quantity - 1)} className="detail-qty-btn">
                  －
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="product-detail-actions-panel">
              <div className="cart-checkout-actions-row">
                <button onClick={handleBuyNowClick} className="buy-now-action-btn" disabled={availableStock < 1}>
                  اشتري الآن
                </button>
                <button onClick={handleAddToCartClick} className="add-to-cart-action-btn" disabled={availableStock < 1}>
                  <svg className="action-cart-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>أضف للسلة</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Tabs (Description & Specifications) */}
        <div className="product-tabs-section">
          <div className="tabs-header-bar">
            <button
              onClick={() => setActiveInfoTab("description")}
              className={`info-tab-btn ${activeInfoTab === "description" ? "active" : ""}`}
            >
              الوصف التفصيلي
            </button>
            <button
              onClick={() => setActiveInfoTab("specs")}
              className={`info-tab-btn ${activeInfoTab === "specs" ? "active" : ""}`}
            >
              المواصفات الفنية
            </button>
          </div>

          <div className="tabs-content-box">
            {activeInfoTab === "description" && (
              <div className="tab-description-content">
                <p>{product.longDescription}</p>
                {product.descriptionEn && <p dir="ltr">{product.descriptionEn}</p>}
                <div className="shipping-notice-box">
                  <h4>💡 سياسة الشحن والضمان:</h4>
                  <ul>
                    <li>رسوم الشحن ثابتة {SHIPPING_FEE} ج.م لكافة محافظات مصر.</li>
                    <li>توصيل سريع لباب المنزل خلال 2-4 أيام عمل لكافة محافظات مصر.</li>
                    <li>الدفع عند الاستلام بعد معاينة المنتج والتأكد منه.</li>
                    <li>إمكانية استبدال أو استرجاع مجانية خلال 14 يوماً في حال وجود عيوب صناعة.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeInfoTab === "specs" && (
              <div className="tab-specifications-content">
                <table className="specs-table">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, val]) => (
                      <tr key={key}>
                        <td className="spec-key">{key}</td>
                        <td className="spec-val">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Video Showcase Section */}
        {product.videoUrl && (
          <section className="product-video-showcase-section">
            <div className="video-section-title-wrapper">
              <span className="video-gold-ornament">✦</span>
              <h2 className="video-showcase-title">معاينة حية للمنتج بالفيديو</h2>
              <span className="video-gold-ornament">✦</span>
            </div>
            
            <div className="video-player-container-glow">
              <div className="video-player-frame">
                <div className="video-player-border-corners">
                  <div className="corner c-top-right"></div>
                  <div className="corner c-top-left"></div>
                  <div className="corner c-bottom-right"></div>
                  <div className="corner c-bottom-left"></div>
                </div>
                <video
                  src={product.videoUrl}
                  controls
                  poster={product.image}
                  className="product-demo-video-tag"
                  preload="metadata"
                >
                  متصفحك لا يدعم تشغيل الفيديو المباشر.
                </video>
              </div>
              <div className="video-player-caption-box">
                <p>شاهد جودة صناعة وطباعة المنتج وتفاصيله الدقيقة بالفيديو قبل الشراء</p>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
