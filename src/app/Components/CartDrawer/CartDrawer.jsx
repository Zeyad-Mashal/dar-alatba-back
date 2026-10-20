"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { SHIPPING_FEE } from "../../lib/shipping";
import "./CartDrawer.css";

export default function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
    isMounted
  } = useCart();

  const drawerRef = useRef(null);

  // Close drawer on escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsCartOpen(false);
      }
    };
    if (isCartOpen) {
      document.body.classList.add("no-scroll");
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => {
      document.body.classList.remove("no-scroll");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCartOpen, setIsCartOpen]);

  // Click outside to close
  const handleOverlayClick = (e) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target)) {
      setIsCartOpen(false);
    }
  };

  if (!isMounted) return null;

  return (
    <>
      {/* Backdrop Blur Overlay */}
      <div 
        className={`cart-drawer-overlay ${isCartOpen ? "visible" : ""}`} 
        onClick={handleOverlayClick}
      >
        {/* Sliding Panel */}
        <div 
          ref={drawerRef}
          className={`cart-drawer-panel ${isCartOpen ? "open" : ""}`}
        >
          {/* Header */}
          <div className="cart-drawer-header">
            <div className="cart-header-title">
              <h2>سلة المشتريات</h2>
              <span className="cart-items-badge-total">{cartCount}</span>
            </div>
            
            <button 
              className="cart-close-btn" 
              onClick={() => setIsCartOpen(false)}
              aria-label="إغلاق السلة"
            >
              <svg className="close-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body / Items list */}
          <div className="cart-drawer-body">
            {cartItems.length === 0 ? (
              <div className="cart-empty-state">
                <div className="empty-cart-icon-wrapper">
                  <svg className="empty-cart-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3>سلة التسوق فارغة حالياً</h3>
                <p>تصفح كتبنا المتميزة وإصدار الراديو التراثي وأضف ما يعجبك للسلة.</p>
                <button 
                  className="start-shopping-btn" 
                  onClick={() => {
                    setIsCartOpen(false);
                    const booksSection = document.getElementById("books-section");
                    if (booksSection) {
                      booksSection.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  ابدأ التسوق الآن
                </button>
              </div>
            ) : (
              <div className="cart-items-list">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item-card">
                    {/* Item Image */}
                    <div className="cart-item-img-container">
                      <Image 
                        src={item.image} 
                        alt={item.title} 
                        width={64}
                        height={64}
                        className="cart-item-img"
                      />
                    </div>

                    {/* Item Info */}
                    <div className="cart-item-info">
                      <h4 className="cart-item-title">{item.title}</h4>
                      <span className="cart-item-price-each">{item.price} ج.م</span>
                      
                      {/* Controls Row */}
                      <div className="cart-item-controls-row">
                        <div className="quantity-adjuster">
                          <button 
                            className="qty-btn"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="زيادة الكمية"
                          >
                            ＋
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button 
                            className="qty-btn"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="تقليل الكمية"
                          >
                            －
                          </button>
                        </div>

                        <button 
                          className="cart-item-remove-btn"
                          onClick={() => removeFromCart(item.id)}
                          aria-label="إزالة العنصر"
                        >
                          <svg className="trash-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer (Total and Actions) */}
          {cartItems.length > 0 && (
            <div className="cart-drawer-footer">
              <div className="cart-summary-row sub">
                <span className="summary-label">المنتجات:</span>
                <span className="summary-value">{cartTotal} ج.م</span>
              </div>
              <div className="cart-summary-row sub">
                <span className="summary-label">الشحن:</span>
                <span className="summary-value">{SHIPPING_FEE} ج.م</span>
              </div>
              <div className="cart-summary-row">
                <span className="summary-label">المجموع الكلي:</span>
                <span className="summary-value">{cartTotal + SHIPPING_FEE} ج.م</span>
              </div>
              
              <div className="cart-footer-actions">
                <Link 
                  href="/checkout"
                  className="site-checkout-btn"
                  onClick={() => setIsCartOpen(false)}
                >
                  <svg className="checkout-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>إكمال الطلب عبر الموقع</span>
                </Link>
                
                <button 
                  className="clear-cart-btn"
                  onClick={clearCart}
                >
                  تفريغ السلة
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
