

"use client";

import { useState } from "react";
import IntroAnimation from "./Components/IntroAnimation/IntroAnimation";
import Navbar from "./Components/Navbar/Navbar";
import Hero from "./Components/Hero/Hero";
import BooksSection from "./Components/BooksSection/BooksSection";
import RadioBanner from "./Components/RadioBanner/RadioBanner";
import Footer from "./Components/Footer/Footer";
export default function Home() {
  const [introFinished, setIntroFinished] = useState(false);

  return (
    <>
      {/* Intro Animation Loader Screen */}
      <IntroAnimation onComplete={() => setIntroFinished(true)} />

      {/* Main Website Wrapper */}
      <div className={`main-layout-wrapper ${introFinished ? "intro-ended" : "intro-running"}`}>
        {/* Navigation Bar */}
        <Navbar />

        <main className="flex-grow">
          {/* Hero Section */}
          <Hero />

          {/* Books E-Commerce Section */}
          <BooksSection />

          {/* Featured Vintage Radio Banner */}
          <RadioBanner />

          {/* About us and Egypt Identity section */}
          <section id="about-section" className="py-20 bg-white relative overflow-hidden border-t border-[rgba(197,168,128,0.2)]">
            <div className="absolute inset-0 opacity-[0.03] arabesque-pattern pointer-events-none"></div>
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
              <div className="text-right">
                <div className="inline-flex items-center gap-2 bg-[rgba(15,59,46,0.05)] border border-[rgba(197,168,128,0.3)] px-4 py-1.5 rounded-full mb-6">
                  <span className="font-semibold text-sm text-[#0f3b2e] font-sans">أصالة الهوية المصرية</span>
                </div>
                <h2 className="font-serif text-4xl font-bold text-[#0f3b2e] mb-6 leading-snug">قصة دار الأطباء ورسالتها</h2>
                <p className="font-sans text-gray-700 leading-relaxed mb-6 text-base">
                  تأسست دار الأطباء برؤية مصرية خالصة تسعى لنشر المعرفة الإسلامية الوسطية، وتسهيل الوصول للكتب الشرعية والتراثية القيمة التي تغذي العقل وتملأ الوجدان بنور البصيرة. نحن لا نبيع كتباً فحسب، بل نقدم تجربة متكاملة تربط الجيل الحالي بنفحات الماضي العطر.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="border-r-2 border-[#ebdcb9] pr-4">
                    <h4 className="font-serif text-[#0f3b2e] text-lg font-bold mb-2">رؤية واضحة</h4>
                    <p className="font-sans text-sm text-gray-600">تقديم إصدارات إسلامية موثوقة تخاطب العقول والقلوب بالوسطية والرحمة.</p>
                  </div>
                  <div className="border-r-2 border-[#ebdcb9] pr-4">
                    <h4 className="font-serif text-[#0f3b2e] text-lg font-bold mb-2">تراث أصيل</h4>
                    <p className="font-sans text-sm text-gray-600">إحياء الروح التراثية المصرية عبر أجهزة الراديو المصنوعة بحرفية يدوية ممتازة.</p>
                  </div>
                </div>
              </div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden border-2 border-[#ebdcb9] shadow-lg">
                <img
                  src="/images/logo.jpeg"
                  alt="دار الأطباء"
                  className="w-full h-full object-cover filter brightness-[0.9] contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f3b2e]/60 to-transparent"></div>
                <div className="absolute bottom-6 right-6 left-6 text-right">
                  <span className="font-serif text-[#ebdcb9] text-2xl font-bold block mb-1">دار الأطباء للكتب والراديو</span>
                  <span className="font-sans text-white/90 text-sm">شريكك المعرفي الأول في كل بيت إسلامي</span>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Us section with beautiful inputs */}
          <section id="contact-section" className="py-20 bg-[#faf6f0] border-t border-[rgba(197,168,128,0.2)]">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 className="font-serif text-4xl font-bold text-[#0f3b2e] mb-4">يسعدنا تواصلك معنا</h2>
              <p className="font-sans text-gray-600 mb-12 max-w-xl mx-auto">
                لديك استفسار عن كتاب معين؟ أو تود طلب راديو الأطباء بمواصفات خاصة؟ تواصل معنا مباشرة وسنقوم بالرد عليك في أسرع وقت.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto text-right">
                <div className="bg-white p-6 rounded-xl border border-[rgba(197,168,128,0.2)] shadow-sm hover:border-[#c5a880] transition duration-300">
                  <div className="w-12 h-12 bg-[rgba(15,59,46,0.05)] rounded-full flex items-center justify-center mb-4 text-[#0f3b2e]">
                    <svg className="w-6 h-6 text-[#0f3b2e]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.59 1.978 14.12 1.05 11.5 1.05c-5.448 0-9.886 4.376-9.89 9.805 0 1.764.475 3.483 1.376 5.017l-.99 3.616 3.738-.971c1.554.914 3.09 1.417 4.323 1.417zm11.366-7.73c-.3-.149-1.772-.862-2.046-.961-.273-.099-.473-.149-.673.15-.2.297-.771.961-.947 1.158-.175.197-.35.223-.65.074-1.025-.515-1.785-.927-2.484-2.115-.178-.302-.078-.429.028-.528.096-.089.213-.248.3-.372.088-.124.117-.21.176-.35.058-.14.029-.263-.014-.362-.044-.099-.473-1.125-.648-1.523-.17-.396-.34-.343-.472-.35-.121-.006-.26-.008-.399-.008-.14 0-.368.052-.56.26-.192.208-.73.702-.73 1.71 0 1.009.743 1.984.846 2.117.103.134 1.462 2.22 3.541 3.104.495.21 1.01.328 1.5.485.496.157.947.135 1.303.082.397-.06 1.772-.713 2.022-1.402.25-.689.25-1.282.175-1.402-.074-.12-.272-.22-.572-.37z" />
                    </svg>
                  </div>
                  <h4 className="font-serif font-bold text-[#0f3b2e] text-lg mb-2">تواصل عبر واتساب</h4>
                  <a href="https://wa.me/201036212030" target="_blank" rel="noopener noreferrer" className="font-sans text-[#c5a880] hover:text-[#0f3b2e] text-xl font-bold block transition">01036212030</a>
                  <p className="font-sans text-gray-500 text-sm mt-1">للاستفسار فقط — الطلب يتم عبر الموقع</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-[rgba(197,168,128,0.2)] shadow-sm hover:border-[#c5a880] transition duration-300">
                  <div className="w-12 h-12 bg-[rgba(15,59,46,0.05)] rounded-full flex items-center justify-center mb-4 text-[#0f3b2e]">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h4 className="font-serif font-bold text-[#0f3b2e] text-lg mb-2">اتصال هاتفي مباشر</h4>
                  <a href="tel:+201036212030" className="font-sans text-[#c5a880] hover:text-[#0f3b2e] text-xl font-bold block transition">01036212030</a>
                  <p className="font-sans text-gray-500 text-sm mt-1">متاح طوال اليوم للاتصال الصوتي المباشر</p>
                </div>
              </div>

              <div className="bg-[#0f3b2e] text-white p-8 rounded-2xl border-2 border-[#ebdcb9] shadow-xl text-right flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#ebdcb9] mb-2">اطلب من الموقع فقط</h3>
                  <p className="font-sans text-white/80 text-sm max-w-xl">
                    أضف منتجاتك للسلة وأكمل الطلب من صفحة الدفع. بعد تسجيل الطلب يتفتح واتساب تلقائياً ببيانات الأوردر كاملة لتأكيد الشحن.
                  </p>
                </div>
                <a
                  href="/shop"
                  className="font-sans bg-[#ebdcb9] text-[#0f3b2e] px-8 py-3.5 rounded-full font-bold hover:bg-[#c5a880] hover:text-white transition duration-300 shadow-md whitespace-nowrap"
                >
                  تصفح المتجر الآن
                </a>
              </div>
            </div>
          </section>
        </main>

        {/* Brand Footer */}
        <Footer />
      </div>

      {/* Global CSS transition helper for layouts */}
      <style jsx global>{`
        .main-layout-wrapper {
          opacity: 0;
          transition: opacity 1s ease-in-out;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .main-layout-wrapper.intro-ended {
          opacity: 1;
        }
        .main-layout-wrapper.intro-running {
          display: none;
        }
      `}</style>
    </>
  );
}
