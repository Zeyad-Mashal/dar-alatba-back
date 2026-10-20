"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import "./Hero.css";

const heroSlides = [
  { src: "/images/p1.jpeg", alt: "إصدارات دار الأطباء من المصاحف والكتب الإسلامية" },
  { src: "/images/radio.jpeg", alt: "راديو الأطباء التراثي المصنوع يدوياً" },
  { src: "/images/p8.jpeg", alt: "كتب التفسير والحفظ من دار الأطباء" },
  { src: "/images/p5.jpeg", alt: "القرآن الكريم بترجمة معاني الإنجليزية" },
  { src: "/images/p10.jpeg", alt: "قصص الأنبياء من إصدارات دار الأطباء" },
];

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  const handleScrollTo = (e, targetId) => {
    e.preventDefault();
    const element = document.querySelector(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="hero-section" aria-label="الواجهة الرئيسية">
      <div className="hero-media" aria-hidden="true">
        {heroSlides.map((slide, idx) => (
          <div
            key={slide.src}
            className={`hero-slide ${idx === activeIndex ? "is-active" : ""}`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={idx === 0}
              sizes="100vw"
              className="hero-slide-img"
            />
          </div>
        ))}
        <div className="hero-media-overlay" />
        <div className="hero-media-grain" />
      </div>

      <div className="hero-content">
        <p className="hero-brand">دار الأطباء</p>

        <h1 className="hero-headline">زادُ معرفتِك ونورُ بصيرتِك</h1>

        <p className="hero-lead">
          كتب إسلامية مختارة ومصاحف تعليمية مميزة — من قلب مصر إلى بيتك.
        </p>

        <div className="hero-actions">
          <a
            href="#books-section"
            className="hero-btn hero-btn-primary"
            onClick={(e) => handleScrollTo(e, "#books-section")}
          >
            تصفح الكتب
          </a>
          <a
            href="#radio-section"
            className="hero-btn hero-btn-ghost"
            onClick={(e) => handleScrollTo(e, "#radio-section")}
          >
            مصحف التجويد
          </a>
        </div>

        <div className="hero-progress" aria-hidden="true">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`hero-progress-dot ${idx === activeIndex ? "is-active" : ""}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`عرض الصورة ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
