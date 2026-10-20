import Navbar from "../../Components/Navbar/Navbar";
import ProductDetails from "../../Components/ProductDetails/ProductDetails";
import Footer from "../../Components/Footer/Footer";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "";

export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const response = await fetch(`${API_BASE_URL}/getProductDetails/${id}`);
    if (!response.ok) throw new Error("Product not found");
    const payload = await response.json();
    const product = payload.data;

    return {
      title: `${product.name} | دار الأطباء`,
      description: product.description
    };
  } catch {
    return {
      title: "تفاصيل المنتج | دار الأطباء",
      description: "تصفح تفاصيل ومواصفات المنتج من متجر دار الأطباء."
    };
  }
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <ProductDetails productId={id} />
      </main>
      <Footer />
    </div>
  );
}
