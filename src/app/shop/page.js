import { Suspense } from "react";
import Navbar from "../Components/Navbar/Navbar";
import ServerShopContent from "../Components/ShopContent/ServerShopContent";
import Footer from "../Components/Footer/Footer";

export const metadata = {
  title: "المتجر | دار الأطباء",
  description: "تصفح جميع منتجات وأقسام متجر دار الأطباء وأضف منتجاتك المفضلة إلى سلة المشتريات."
};

export default function ShopPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<div className="shop-page-wrapper pattern-bg min-h-[50vh]" />}>
          <ServerShopContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
