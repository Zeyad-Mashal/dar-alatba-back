"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import CategoriesPanel from "./CategoriesPanel";
import OptionsPanel from "./OptionsPanel";
import ProductsPanel from "./ProductsPanel";
import OrdersPanel from "./OrdersPanel";
import AnnouncementsPanel from "./AnnouncementsPanel";
import "./admin.css";

export default function AdminPage() {
  const router = useRouter();
  const { isMounted } = useCart();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [backendProductsCount, setBackendProductsCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (isMounted) {
        const loggedIn = sessionStorage.getItem("isAdminLoggedIn") === "true";
        if (!loggedIn) {
          router.push("/");
        } else {
          setIsAuthenticated(true);
        }
      }
    });
  }, [isMounted, router]);

  const handleLogout = () => {
    sessionStorage.removeItem("isAdminLoggedIn");
    router.push("/");
  };

  if (!isMounted || !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b2920] text-[#ebdcb9] font-sans">
        <div
          className="spinner-loader mb-4"
          style={{ width: "40px", height: "40px", borderWidth: "4px" }}
        ></div>
        <p className="font-sans text-lg">جاري التحقق من صلاحيات المشرف...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container flex flex-col min-h-screen bg-[#faf6f0]">
      <header className="admin-header glass-nav text-white py-4 px-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full padding-[2px] bg-[#ebdcb9] overflow-hidden border border-[#ebdcb9]/30">
            <img
              src="/images/logo.jpeg"
              alt="لوحة التحكم"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="text-right">
            <h1 className="font-serif text-lg font-bold text-[#ebdcb9] m-0">
              لوحة التحكم - دار الأطباء
            </h1>
            <span className="text-[10px] text-white/60 font-sans">
              نظام إدارة الطلبيات والمنتجات
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/" className="back-site-btn font-sans">
            عرض الموقع
          </Link>
          <button onClick={handleLogout} className="admin-logout-btn font-sans">
            تسجيل الخروج
          </button>
        </div>
      </header>

      <div className="admin-main-wrapper flex-grow max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 bg-[#0b2920] border-2 border-[#ebdcb9]/30 rounded-2xl p-4 text-right shadow-md h-fit">
          <div className="admin-info-badge mb-6 p-4 bg-[#0f3b2e] rounded-xl border border-[rgba(197,168,128,0.2)]">
            <span className="text-xs text-white/50 block font-sans mb-1">
              المستخدم الحالي:
            </span>
            <span className="font-sans font-bold text-[#ebdcb9]">
              مدير الموقع (Admin)
            </span>
            <span className="text-[10px] text-emerald-400 font-sans block mt-1">
              ● متصل الآن
            </span>
          </div>

          <div className="sidebar-tabs-list flex flex-row lg:flex-col gap-2">
            <button
              onClick={() => setActiveTab("orders")}
              className={`sidebar-tab-btn w-full text-right ${
                activeTab === "orders" ? "active" : ""
              }`}
            >
              📊 الطلبيات الواردة
              <span className="orders-count-badge bg-[#ebdcb9] text-[#0b2920]">
                {pendingOrdersCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`sidebar-tab-btn w-full text-right ${
                activeTab === "products" ? "active" : ""
              }`}
            >
              📚 إدارة المنتجات
              <span className="products-count-badge bg-white/10 text-white/80">
                {backendProductsCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`sidebar-tab-btn w-full text-right ${
                activeTab === "categories" ? "active" : ""
              }`}
            >
              🗂️ الأقسام
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={`sidebar-tab-btn w-full text-right ${
                activeTab === "announcements" ? "active" : ""
              }`}
            >
              📢 شريط العروض
            </button>
            <button
              onClick={() => setActiveTab("options")}
              className={`sidebar-tab-btn w-full text-right ${
                activeTab === "options" ? "active" : ""
              }`}
            >
              🎨 الألوان والمقاسات
            </button>
          </div>
        </aside>

        <main className="lg:col-span-9 bg-white border border-[rgba(197,168,128,0.2)] p-6 md:p-8 rounded-2xl shadow-sm text-right">
          {activeTab === "orders" && (
            <OrdersPanel onCountChange={setPendingOrdersCount} />
          )}
          {activeTab === "products" && (
            <ProductsPanel onCountChange={setBackendProductsCount} />
          )}
          {activeTab === "categories" && <CategoriesPanel />}
          {activeTab === "options" && <OptionsPanel />}
          {activeTab === "announcements" && <AnnouncementsPanel />}
        </main>
      </div>

      <footer className="admin-footer py-6 border-t border-gray-200 text-center text-xs text-gray-500 font-sans">
        <p>
          لوحة تحكم دار الأطباء © {new Date().getFullYear()} - جميع الصلاحيات
          محفوظة للمشرفين فقط.
        </p>
      </footer>
    </div>
  );
}
