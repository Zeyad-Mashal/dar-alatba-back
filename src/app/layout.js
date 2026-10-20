import { Amiri, Cairo } from "next/font/google";
import { CartProvider } from "./context/CartContext";
import CartDrawer from "./Components/CartDrawer/CartDrawer";
import "./globals.css";

const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic"],
  variable: "--font-amiri",
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "دار الأطباء | الكتب والراديو الإسلامي",
  description: "متجر دار الأطباء - وجهتك المتميزة لبيع أحدث وأقيم الكتب الإسلامية، بالإضافة إلى أجهزة الراديو التراثية عالية الجودة بروح مصرية أصيلة.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${amiri.variable} ${cairo.variable} h-full antialiasedScroll`}
    >
      <body className="min-h-full flex flex-col bg-[#faf6f0] text-[#1e201e] font-sans selection:bg-[#c5a880]/30 selection:text-[#0f3b2e]">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
