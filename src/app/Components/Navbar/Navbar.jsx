"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import "./Navbar.css";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { cartCount, setIsCartOpen } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (pathname !== "/shop") return;
    const queryFromUrl = new URLSearchParams(window.location.search).get("q") || "";
    setSearchQuery(queryFromUrl);
  }, [pathname]);

  const handleScrollTo = (e, targetId) => {
    if (pathname !== "/") {
      // Allow default Link navigation to homepage sections
      return;
    }

    if (targetId.startsWith("#")) {
      e.preventDefault();
      if (targetId === "#") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const element = document.querySelector(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  const onDarkHero = pathname === "/" && !isScrolled;

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    setIsMobileMenuOpen(false);

    if (!trimmed) {
      router.push("/shop");
      return;
    }

    router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
  };

  const searchField = (variant) => (
    <form
      className={`navbar-search ${variant}`}
      onSubmit={handleSearchSubmit}
      role="search"
    >
      <label htmlFor={`navbar-search-${variant}`} className="sr-only">
        البحث باسم المنتج
      </label>
      <svg className="navbar-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        id={`navbar-search-${variant}`}
        type="search"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="ابحث باسم المنتج..."
        className="navbar-search-input"
        autoComplete="off"
      />
      <button type="submit" className="navbar-search-submit">
        بحث
      </button>
    </form>
  );

  return (
    <nav
      className={`navbar-container ${isScrolled ? "scrolled" : ""} ${isMobileMenuOpen ? "mobile-menu-open" : ""} ${onDarkHero ? "on-dark-hero" : ""}`}
    >
      <div className="navbar-wrapper">
        {/* Right: Logo & Title */}
        <Link href="/" className="navbar-brand text-decoration-none" onClick={(e) => handleScrollTo(e, "#")}>
          <div className="brand-logo-frame">
            <Image
              src="/images/logo.jpeg"
              alt="دار الأطباء"
              width={45}
              height={45}
              className="brand-logo"
            />
          </div>
          <span className="brand-title">دار الأطباء</span>
        </Link>

        {/* Center: Navigation Links (Desktop) */}
        <ul className="nav-links">
          <li>
            <Link 
              href="/" 
              className={`nav-link ${pathname === "/" ? "active" : ""}`} 
              onClick={(e) => handleScrollTo(e, "#")}
            >
              الرئيسية
            </Link>
          </li>
          <li>
            <Link 
              href="/shop"
              className={`nav-link ${pathname === "/shop" ? "active" : ""}`}
            >
              المتجر
            </Link>
          </li>
          <li>
            <Link 
              href="/#about-section" 
              className="nav-link" 
              onClick={(e) => handleScrollTo(e, "#about-section")}
            >
              من نحن
            </Link>
          </li>
          <li>
            <Link 
              href="/#contact-section" 
              className="nav-link" 
              onClick={(e) => handleScrollTo(e, "#contact-section")}
            >
              اتصل بنا
            </Link>
          </li>
        </ul>

        {searchField("desktop")}

        {/* Left: Tools & Interactions */}
        <div className="nav-tools">
          {/* Cart Icon */}
          <button className="tool-btn cart-btn" onClick={() => setIsCartOpen(true)} aria-label="سلة المشتريات">
            <span className="cart-badge">{cartCount}</span>
            <svg className="icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </button>

          {/* Shop CTA (Desktop) */}
          <Link
            href="/shop"
            className="navbar-cta-btn text-decoration-none"
          >
            <span>تسوق الآن</span>
          </Link>

          {/* Mobile Menu Button */}
          <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="القائمة الجانبية">
            {isMobileMenuOpen ? (
              <svg className="icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="navbar-mobile-search-row">
        {searchField("mobile")}
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Drawer Menu */}
      <div className={`mobile-drawer ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="drawer-bg-patterns"></div>
        <ul className="mobile-nav-links">
          <li>
            <Link 
              href="/" 
              className={`mobile-nav-link ${pathname === "/" ? "active" : ""}`} 
              onClick={(e) => { setIsMobileMenuOpen(false); handleScrollTo(e, "#"); }}
            >
              الرئيسية
            </Link>
          </li>
          <li>
            <Link 
              href="/shop"
              className={`mobile-nav-link ${pathname === "/shop" ? "active" : ""}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              المتجر
            </Link>
          </li>
          <li>
            <Link 
              href="/#about-section" 
              className="mobile-nav-link" 
              onClick={(e) => { setIsMobileMenuOpen(false); handleScrollTo(e, "#about-section"); }}
            >
              من نحن
            </Link>
          </li>
          <li>
            <Link 
              href="/#contact-section" 
              className="mobile-nav-link" 
              onClick={(e) => { setIsMobileMenuOpen(false); handleScrollTo(e, "#contact-section"); }}
            >
              اتصل بنا
            </Link>
          </li>
          <li className="drawer-cta-li">
            <Link
              href="/shop"
              className="drawer-cta-btn text-decoration-none"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>تسوق الآن من الموقع</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
