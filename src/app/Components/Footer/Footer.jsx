"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Footer() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (email === "admin@daralatba.com" && password === "Alatba#Admin2026") {
      sessionStorage.setItem("isAdminLoggedIn", "true");
      setIsModalOpen(false);
      setEmail("");
      setPassword("");
      setError("");
      router.push("/admin");
    } else {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة!");
    }
  };

  const handleScrollTo = (e, targetId) => {
    // If we are not on the homepage, let the standard link handle navigation.
    if (window.location.pathname !== "/") {
      return;
    }
    
    e.preventDefault();
    if (targetId === "#") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const element = document.querySelector(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="bg-[#0b2920] text-[#faf6f0] border-t border-[rgba(197,168,128,0.25)] py-16 relative">
      <div className="absolute inset-0 opacity-[0.02] arabesque-pattern pointer-events-none"></div>
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 relative z-10 text-right">
        
        {/* Column 1: Brand Info */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-6 justify-start">
            <div 
              className="w-12 h-12 rounded-full padding-[2px] bg-gradient-to-r from-[#ebdcb9] to-[#c5a880] overflow-hidden border border-[#ebdcb9]/30 cursor-pointer hover:scale-105 transition duration-300"
              onClick={() => setIsModalOpen(true)}
            >
              <img src="/images/logo.jpeg" alt="دار الأطباء" className="w-full h-full object-cover rounded-full" />
            </div>
            <span 
              className="font-serif text-[#ebdcb9] text-2xl font-bold cursor-pointer hover:text-[#c5a880] transition duration-300"
              onClick={() => setIsModalOpen(true)}
            >
              دار الأطباء
            </span>
          </div>
          <p className="font-sans text-white/70 text-sm leading-relaxed mb-6">
            دار الأطباء هي علامة تجارية مصرية رائدة متخصصة في توفير المراجع والمصاحف والكتب الإسلامية النادرة، وإصدارات الراديو الإسلامية التراثية، لتقديم نور المعرفة لبيوت المسلمين بكافة أرجاء العالم.
          </p>
          <p className="font-serif text-[#ebdcb9] italic text-base">
            "زادُ معرفتِك ونورُ بصيرتِك"
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="font-serif text-[#ebdcb9] text-lg font-bold mb-6 pb-2 border-b border-[rgba(197,168,128,0.15)]">روابط سريعة</h4>
          <ul className="font-sans space-y-3 text-sm text-white/80">
            <li>
              <Link href="/" className="hover:text-[#ebdcb9] transition duration-200" onClick={(e) => handleScrollTo(e, "#")}>الرئيسية</Link>
            </li>
            <li>
              <Link href="/shop" className="hover:text-[#ebdcb9] transition duration-200">المتجر</Link>
            </li>
            <li>
              <Link href="/#about-section" className="hover:text-[#ebdcb9] transition duration-200" onClick={(e) => handleScrollTo(e, "#about-section")}>عن الدار</Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Legal & Security */}
        <div>
          <h4 className="font-serif text-[#ebdcb9] text-lg font-bold mb-6 pb-2 border-b border-[rgba(197,168,128,0.15)]">حقوق وتواصل</h4>
          <ul className="font-sans space-y-3 text-sm text-white/80">
            <li>طرق الشحن والطلب</li>
            <li>سياسة الاستبدال والاسترجاع</li>
            <li>الدعم الفني المباشر</li>
            <li>توزيع الجملة والمكاتب</li>
          </ul>
        </div>

      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-[rgba(197,168,128,0.1)] text-center text-xs text-white/50 font-sans relative z-10">
        <p>جميع الحقوق محفوظة © {new Date().getFullYear()} لـ دار الأطباء للكتب والراديو الإسلامي.</p>
        <p className="mt-2">صنع بحب وأصالة بأيدٍ مصرية 🇪🇬</p>
      </div>

      {/* Admin Login Modal */}
      {isModalOpen && (
        <div className="admin-login-modal-overlay">
          <div className="admin-login-modal-card glass-modal text-right" dir="rtl">
            <div className="modal-header-row mb-6">
              <h3 className="font-serif text-xl font-bold text-[#ebdcb9] m-0">تسجيل دخول الإدارة</h3>
              <button 
                type="button" 
                onClick={() => { setIsModalOpen(false); setError(""); setEmail(""); setPassword(""); }}
                className="close-modal-x-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm font-sans mb-3 text-center">
                  {error}
                </div>
              )}
              
              <div className="modal-input-group">
                <label className="modal-label font-sans block text-sm text-white/80 mb-2">البريد الإلكتروني المشرف</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  className="modal-text-input text-left"
                  dir="ltr"
                  required
                />
              </div>

              <div className="modal-input-group animate-fade-in">
                <label className="modal-label font-sans block text-sm text-white/80 mb-2">كلمة المرور المشرف</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  className="modal-text-input text-left"
                  dir="ltr"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="modal-submit-login-btn w-full mt-6"
              >
                دخول لوحة التحكم
              </button>
            </form>
          </div>
        </div>
      )}
    </footer>
  );
}
