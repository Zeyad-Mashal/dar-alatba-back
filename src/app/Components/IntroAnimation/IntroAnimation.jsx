"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import "./IntroAnimation.css";

export default function IntroAnimation({ onComplete }) {
  const [isFading, setIsFading] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    // Add no-scroll class to body when mounted
    document.body.classList.add("no-scroll");

    // Start fade out after 2.5 seconds
    const fadeTimeout = setTimeout(() => {
      setIsFading(true);
    }, 2500);

    // Unmount component and trigger onComplete after 3.2 seconds
    const removeTimeout = setTimeout(() => {
      setIsMounted(false);
      document.body.classList.remove("no-scroll");
      if (onComplete) onComplete();
    }, 3200);

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(removeTimeout);
      document.body.classList.remove("no-scroll");
    };
  }, [onComplete]);

  if (!isMounted) return null;

  return (
    <div className={`intro-overlay ${isFading ? "fade-out-up" : ""}`}>
      {/* Background patterns */}
      <div className="intro-bg-patterns">
        <div className="intro-pattern-circle-1"></div>
        <div className="intro-pattern-circle-2"></div>
      </div>

      <div className="intro-content">
        {/* Islamic Star Pattern SVG Rotating */}
        <div className="islamic-star-wrapper">
          <svg
            className="islamic-star-svg"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M50 0L61.2 27.6L90.5 15.5L78.4 44.8L100 56L72.4 67.2L84.5 96.5L55.2 84.4L44 100L32.8 72.4L3.5 84.5L15.6 55.2L0 44L27.6 32.8L15.5 3.5L44.8 15.6L50 0Z"
              stroke="url(#goldGradient)"
              strokeWidth="0.8"
              strokeDasharray="4 4"
            />
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ebdcb9" />
                <stop offset="50%" stopColor="#c5a880" />
                <stop offset="100%" stopColor="#d4af37" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Logo with gold frame */}
        <div className="logo-frame-container">
          <div className="logo-frame-glow"></div>
          <div className="logo-frame">
            <Image
              src="/images/logo.jpeg"
              alt="شعار دار الأطباء"
              width={130}
              height={130}
              priority
              className="logo-img"
            />
          </div>
        </div>

        {/* Brand Name with calligraphy feeling */}
        <h1 className="brand-name-intro">دار الأطباء</h1>
        
        {/* Animated divider */}
        <div className="intro-divider"></div>

        {/* Tagline */}
        <p className="brand-tagline-intro">للكتب والراديو الإسلامي التراثي</p>
      </div>

      {/* Egyptian-Islamic quote in footer */}
      <div className="intro-footer">
        <p>زادُ معرفتِك ونورُ بصيرتِك</p>
      </div>
    </div>
  );
}
