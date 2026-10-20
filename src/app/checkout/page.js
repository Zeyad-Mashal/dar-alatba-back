"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../Components/Navbar/Navbar";
import Footer from "../Components/Footer/Footer";
import { useCart } from "../context/CartContext";
import { SHIPPING_FEE } from "../lib/shipping";
import "./checkout.css";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "";

const WHATSAPP_PHONE = "201036212030";

function buildWhatsAppLink(orderInfo) {
  if (!orderInfo) return "#";

  let text = `السلام عليكم ورحمة الله وبركاته،\n`;
  text += `أود تأكيد طلبي الجديد من متجر دار الأطباء 📖✨\n\n`;
  text += `*رقم الطلب:* \`#${orderInfo.orderId}\` 🌟\n`;
  text += `------------------------------------\n`;
  text += `👤 *بيانات العميل:* \n`;
  text += `• الاسم: ${orderInfo.customerName}\n`;
  text += `• الهاتف: ${orderInfo.customerPhone}\n`;
  text += `• المحافظة: ${orderInfo.governorate}\n`;
  text += `• العنوان: ${orderInfo.address}\n\n`;

  text += `📦 *المنتجات المطلوبة:* \n`;
  orderInfo.items.forEach((item, idx) => {
    text += `   ${idx + 1}. *${item.title}* (الكمية: ${item.quantity} | السعر: ${item.price * item.quantity} ج.م)\n`;
  });
  text += `\n`;

  text += `💵 *تفاصيل الحساب:* \n`;
  text += `• إجمالي المنتجات: *${orderInfo.productsTotal} ج.م*\n`;
  text += `• الشحن: *${orderInfo.shipping} ج.م*\n`;
  text += `• إجمالي الفاتورة: *${orderInfo.total} ج.م*\n`;
  text += `• الدفعة المقدمة المسددة: *${orderInfo.deposit} ج.م* 💰\n`;
  text += `• المتبقي عند الاستلام: *${orderInfo.remaining} ج.م*\n\n`;

  text += `💳 *بيانات عملية التحويل:* \n`;
  text += `• رقم الهاتف الراسل: ${orderInfo.senderNumber}\n`;
  text += `• اسم صاحب الحساب: ${orderInfo.senderName}\n\n`;
  text += `------------------------------------\n`;
  text += `*مرفق صورة التحويل كإثبات سداد للدفعة.* الرجاء تأكيد استلام التحويل وتجهيز الطلب. شكراً لكم.`;

  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
}

const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحيرة", "الشرقية", 
  "الغربية", "المنوفية", "القليوبية", "دمياط", "بورسعيد", "الإسماعيلية", 
  "السويس", "كفر الشيخ", "الفيوم", "بني سويف", "المنيا", "أسيوط", 
  "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", 
  "مطروح", "شمال سيناء", "جنوب سيناء"
];

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart, isMounted } = useCart();
  
  // Form fields state
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    governorate: "",
    addressDetails: "",
    senderNumber: "",
    senderName: "",
    receiptFile: null,
    receiptPreview: ""
  });

  // UI States
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [orderInfo, setOrderInfo] = useState(null);

  // Copy helper
  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(""), 2000);
  };

  // Image Upload handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, receipt: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت" }));
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        receiptFile: file
      }));
      setErrors(prev => {
        const { receipt, ...rest } = prev;
        return rest;
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          receiptPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error on type
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  // Form Validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "الاسم بالكامل مطلوب";
    if (!formData.phone.trim()) {
      newErrors.phone = "رقم الهاتف مطلوب";
    } else if (!/^01[0125][0-9]{8}$/.test(formData.phone.trim())) {
      newErrors.phone = "يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)";
    }
    
    if (!formData.governorate) newErrors.governorate = "يرجى اختيار المحافظة";
    if (!formData.addressDetails.trim()) newErrors.addressDetails = "العنوان بالتفصيل مطلوب لتوصيل شحنتك";
    
    if (!formData.senderNumber.trim()) {
      newErrors.senderNumber = "رقم الحساب أو الهاتف الراسل مطلوب";
    }
    if (!formData.senderName.trim()) newErrors.senderName = "اسم صاحب الحساب الراسل مطلوب";
    if (!formData.receiptFile) newErrors.receipt = "يرجى رفع صورة إيصال التحويل";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      window.setTimeout(() => {
        const firstErrorField = document.querySelector(".input-error, .dropzone-error");
        firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      return;
    }

    if (cartItems.length === 0) {
      setErrors((prev) => ({ ...prev, submit: "السلة فارغة، أضف منتجات أولاً" }));
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => {
      const { submit, ...rest } = prev;
      return rest;
    });

    const whatsappWindow = window.open("about:blank", "_blank");

    try {
      const itemsPayload = cartItems.map((item) => ({
        productId: item.productId || String(item.id).split("__")[0],
        quantity: item.quantity,
        sizeId: item.sizeId || "",
        colorId: item.colorId || "",
        sizeName: item.sizeName || "",
        colorName: item.colorName || "",
      }));

      const body = new FormData();
      body.append("customerName", formData.fullName.trim());
      body.append("customerPhone", formData.phone.trim());
      body.append("governorate", formData.governorate);
      body.append("detailedAddress", formData.addressDetails.trim());
      body.append("transferPhone", formData.senderNumber.trim());
      body.append(
        "notes",
        [
          `اسم صاحب الحساب الراسل: ${formData.senderName.trim()}`,
          `الشحن: ${SHIPPING_FEE} ج.م`,
          ...cartItems.map((item) => {
            const variant = [item.sizeName, item.colorName].filter(Boolean).join(" / ");
            return `${item.title} × ${item.quantity}${variant ? ` (${variant})` : ""}`;
          }),
        ].join("\n")
      );
      body.append("items", JSON.stringify(itemsPayload));
      body.append("transferImage", formData.receiptFile);

      const response = await fetch(`${API_BASE_URL}/createOrder`, {
        method: "POST",
        body,
        headers: { Accept: "application/json" }
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تسجيل الطلب، حاول مرة أخرى");
      }

      const order = payload.data;
      const productsTotal = Number(order.totalPrice ?? cartTotal);
      const shipping = SHIPPING_FEE;
      const total = productsTotal + shipping;
      const deposit = 100;
      const remaining = Math.max(total - deposit, 0);

      const nextOrderInfo = {
        orderId: order._id || order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        governorate: order.governorate,
        address: order.detailedAddress,
        senderName: formData.senderName.trim(),
        senderNumber: order.transferPhone,
        items: (order.items || []).map((item) => ({
          id: item.product?._id || item.product || item._id,
          title: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image
        })),
        productsTotal,
        shipping,
        total,
        deposit,
        remaining,
        date: order.createdAt
          ? new Date(order.createdAt).toLocaleDateString("ar-EG")
          : new Date().toLocaleDateString("ar-EG"),
        receiptImage: order.transferImage?.url || formData.receiptPreview,
        status: order.status || "pending"
      };

      const whatsappUrl = buildWhatsAppLink(nextOrderInfo);
      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.location.href = whatsappUrl;
      } else {
        window.location.href = whatsappUrl;
      }

      setOrderInfo(nextOrderInfo);
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.close();
      }
      setErrors((prev) => ({
        ...prev,
        submit: requestError.message || "حدث خطأ أثناء تسجيل الطلب"
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppLink = () => buildWhatsAppLink(orderInfo);

  // Ensure mounted to prevent SSR hydration mismatch
  if (!isMounted) return null;

  // Render Success screen if order submitted
  if (orderInfo) {
    return (
      <div className="flex flex-col min-h-screen bg-[#faf6f0]">
        <Navbar />
        <main className="flex-grow py-16 px-4 md:py-24">
          <div className="max-w-3xl mx-auto text-center success-card-container">
            <div className="success-icon-wrapper mb-6 animate-pulse-slow">
              <svg className="success-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#0f3b2e] mb-4">تم تسجيل طلبك بنجاح!</h1>
            <p className="font-sans text-gray-700 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              بارك الله لك في اختيارك. تم استلام تفاصيل الطلب برقم <span className="font-bold text-[#c5a880] font-sans">#{orderInfo.orderId}</span>.
              يتم تحويلك تلقائياً إلى واتساب لتأكيد الطلب. لو الصفحة ما فتحتش، استخدم الزر أدناه.
            </p>

            {/* Summary Detail Box */}
            <div className="order-summary-box text-right mb-10 p-6 md:p-8 rounded-2xl glass-card">
              <h3 className="font-serif text-xl font-bold text-[#0f3b2e] border-b border-[rgba(197,168,128,0.2)] pb-3 mb-4">ملخص الأوردر</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans mb-6">
                <div>
                  <span className="text-gray-500 block mb-1">الاسم بالكامل:</span>
                  <span className="font-bold text-gray-800">{orderInfo.customerName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">رقم الهاتف:</span>
                  <span className="font-bold text-gray-800">{orderInfo.customerPhone}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">المحافظة والتوصيل:</span>
                  <span className="font-bold text-gray-800">{orderInfo.governorate}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">العنوان بالتفصيل:</span>
                  <span className="font-bold text-gray-800">{orderInfo.address}</span>
                </div>
              </div>

              <h4 className="font-serif text-lg font-bold text-[#0f3b2e] mb-3">الحساب المالي:</h4>
              <div className="bg-[#0f3b2e]/5 border border-[rgba(197,168,128,0.2)] rounded-xl p-4 font-sans mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">إجمالي المنتجات:</span>
                  <span className="font-semibold text-gray-800">{orderInfo.productsTotal} ج.م</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">الشحن:</span>
                  <span className="font-semibold text-gray-800">{orderInfo.shipping} ج.م</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">إجمالي قيمة الفاتورة:</span>
                  <span className="font-semibold text-gray-800">{orderInfo.total} ج.م</span>
                </div>
                <div className="flex justify-between mb-2 text-[#0f3b2e] font-bold">
                  <span>الدفعة المقدمة المدفوعة:</span>
                  <span>{orderInfo.deposit} ج.م</span>
                </div>
                <div className="flex justify-between border-t border-[rgba(197,168,128,0.15)] pt-2 font-semibold">
                  <span className="text-gray-600">المتبقي للدفع عند الاستلام:</span>
                  <span className="text-gray-800">{orderInfo.remaining} ج.م</span>
                </div>
              </div>

              <div className="flex gap-4 items-center bg-[#c5a880]/10 border border-[#c5a880]/20 rounded-xl p-4">
                <div className="success-small-icon text-[#c5a880]">ℹ️</div>
                <p className="text-xs text-gray-700 leading-relaxed font-sans m-0">
                  تم تسجيل حساب التحويل باسم الراسل <span className="font-bold">{orderInfo.senderName}</span> والرقم <span className="font-bold">{orderInfo.senderNumber}</span>. أرسل صورة الإيصال في شات الواتساب لتأكيد المعاملة المالية.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-confirm-btn text-decoration-none"
              >
                <svg className="whatsapp-btn-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.59 1.978 14.12 1.05 11.5 1.05c-5.448 0-9.886 4.376-9.89 9.805 0 1.764.475 3.483 1.376 5.017l-.99 3.616 3.738-.971c1.554.914 3.09 1.417 4.323 1.417zm11.366-7.73c-.3-.149-1.772-.862-2.046-.961-.273-.099-.473-.149-.673.15-.2.297-.771.961-.947 1.158-.175.197-.35.223-.65.074-1.025-.515-1.785-.927-2.484-2.115-.178-.302-.078-.429.028-.528.096-.089.213-.248.3-.372.088-.124.117-.21.176-.35.058-.14.029-.263-.014-.362-.044-.099-.473-1.125-.648-1.523-.17-.396-.34-.343-.472-.35-.121-.006-.26-.008-.399-.008-.14 0-.368.052-.56.26-.192.208-.73.702-.73 1.71 0 1.009.743 1.984.846 2.117.103.134 1.462 2.22 3.541 3.104.495.21 1.01.328 1.5.485.496.157.947.135 1.303.082.397-.06 1.772-.713 2.022-1.402.25-.689.25-1.282.175-1.402-.074-.12-.272-.22-.572-.37z" />
                </svg>
                <span>تأكيد عبر واتساب وإرسال الإيصال</span>
              </a>

              <Link href="/" className="back-to-home-btn text-decoration-none">
                العودة للرئيسية
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate prices safely
  const depositAmount = 100;
  const grandTotal = cartTotal + SHIPPING_FEE;
  const remainingAmount = Math.max(grandTotal - depositAmount, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#faf6f0]">
      <Navbar />
      
      <main className="flex-grow py-12 px-4 md:py-20 pattern-bg">
        <div className="max-w-6xl mx-auto">
          {/* Header Title */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#0f3b2e] mb-4">إتمام عملية الشراء</h1>
            <div className="w-24 h-1 bg-[#c5a880] mx-auto rounded-full"></div>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[rgba(197,168,128,0.2)] rounded-2xl p-8 max-w-xl mx-auto shadow-sm">
              <div className="w-16 h-16 bg-[rgba(15,59,46,0.05)] text-[#0f3b2e] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-gray-800 mb-2">سلة المشتريات فارغة</h3>
              <p className="font-sans text-gray-600 mb-8">يرجى إضافة كتب أو أجهزة راديو أولاً لتتمكن من إتمام طلب الشراء.</p>
              <Link href="/shop" className="start-shopping-btn inline-block text-decoration-none">
                الذهاب للمتجر الآن
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Form Fields (7 cols on lg) */}
              <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white border border-[rgba(197,168,128,0.2)] p-6 md:p-8 rounded-2xl shadow-sm text-right">
                
                {/* Section 1: Personal Details */}
                <div className="form-section mb-10">
                  <div className="flex items-center gap-3 border-b border-[rgba(197,168,128,0.15)] pb-3 mb-6">
                    <span className="section-number-badge">١</span>
                    <h3 className="font-serif text-2xl font-bold text-[#0f3b2e] m-0">البيانات الشخصية</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {/* Full Name */}
                    <div className="input-group-wrapper">
                      <label className="input-label font-sans">الاسم بالكامل <span className="required">*</span></label>
                      <input 
                        type="text" 
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="أدخل اسمك الثلاثي أو الرباعي"
                        className={`form-input-field ${errors.fullName ? "input-error" : ""}`}
                      />
                      {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                    </div>

                    {/* Phone Number */}
                    <div className="input-group-wrapper">
                      <label className="input-label font-sans">رقم الهاتف للتواصل <span className="required">*</span></label>
                      <input 
                        type="tel" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="رقم الهاتف الخاص بك (مثال: 01036212030)"
                        className={`form-input-field text-left ${errors.phone ? "input-error" : ""}`}
                        dir="ltr"
                      />
                      {errors.phone && <span className="error-message">{errors.phone}</span>}
                    </div>

                    {/* Governorate Dropdown */}
                    <div className="input-group-wrapper">
                      <label className="input-label font-sans">المحافظة <span className="required">*</span></label>
                      <div className="select-container">
                        <select 
                          name="governorate"
                          value={formData.governorate}
                          onChange={handleInputChange}
                          className={`form-select-field ${errors.governorate ? "input-error" : ""}`}
                        >
                          <option value="">-- اختر محافظة الشحن --</option>
                          {GOVERNORATES.map((gov) => (
                            <option key={gov} value={gov}>{gov}</option>
                          ))}
                        </select>
                      </div>
                      {errors.governorate && <span className="error-message">{errors.governorate}</span>}
                    </div>

                    {/* Detailed Address */}
                    <div className="input-group-wrapper">
                      <label className="input-label font-sans">العنوان بالتفصيل <span className="required">*</span></label>
                      <textarea 
                        name="addressDetails"
                        value={formData.addressDetails}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="المدينة / المنطقة، اسم الشارع، رقم المبنى، رقم الدور أو علامة مميزة بجوارك"
                        className={`form-textarea-field ${errors.addressDetails ? "input-error" : ""}`}
                      />
                      {errors.addressDetails && <span className="error-message">{errors.addressDetails}</span>}
                    </div>
                  </div>
                </div>

                {/* Section 2: Payment Details */}
                <div className="form-section mb-8">
                  <div className="flex items-center gap-3 border-b border-[rgba(197,168,128,0.15)] pb-3 mb-6">
                    <span className="section-number-badge">٢</span>
                    <h3 className="font-serif text-2xl font-bold text-[#0f3b2e] m-0">تأكيد الدفع والتحويل</h3>
                  </div>

                  {/* Payment Alert Box */}
                  <div className="payment-instructions-box mb-6 p-5 rounded-xl text-sm font-sans leading-relaxed">
                    <h4 className="font-bold text-[#0f3b2e] mb-2 flex items-center gap-2">
                      ⚠️ يجب دفع دفعة مقدمة ثابتة لتأكيد الطلب:
                    </h4>
                    <p className="text-gray-700 mb-4">
                      نظراً لجودة منتجاتنا وتجهيزها خصيصاً لك، يرجى تحويل قيمة الدفعة المقدمة البالغة <strong className="text-[#0f3b2e] font-sans font-bold text-base">{depositAmount} ج.م</strong> لتأكيد جدية الطلب وشحنه. تُضاف رسوم شحن ثابتة <strong className="text-[#0f3b2e] font-sans font-bold text-base">{SHIPPING_FEE} ج.م</strong> على الطلب، ويتم دفع باقي المبلغ وهو <strong className="text-gray-800">{remainingAmount} ج.م</strong> عند الاستلام (يشمل الشحن).
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      {/* Vodafone Cash account */}
                      <div className="payment-account-card">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-[#e60000]">فودافون كاش</span>
                          <span className="text-xs bg-[#e60000]/10 text-[#e60000] px-2 py-0.5 rounded">محفظة</span>
                        </div>
                        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-2 font-mono text-sm">
                          <span className="font-semibold text-gray-800">01036212030</span>
                          <button 
                            type="button" 
                            onClick={() => handleCopy("01036212030", "vodafone")}
                            className="copy-account-btn"
                          >
                            {copiedText === "vodafone" ? "تم النسخ!" : "نسخ الرقم"}
                          </button>
                        </div>
                      </div>

                      {/* InstaPay Account */}
                      <div className="payment-account-card">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-[#5c3dbc]">إنستا باي (InstaPay)</span>
                          <span className="text-xs bg-[#5c3dbc]/10 text-[#5c3dbc] px-2 py-0.5 rounded">IPN</span>
                        </div>
                        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-2 font-mono text-xs">
                          <span className="font-semibold text-gray-800">01036212030@instapay</span>
                          <button 
                            type="button" 
                            onClick={() => handleCopy("01036212030@instapay", "instapay")}
                            className="copy-account-btn"
                          >
                            {copiedText === "instapay" ? "تم النسخ!" : "نسخ العنوان"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transfer Details Form Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Sender Account Phone Number */}
                    <div className="input-group-wrapper">
                      <label className="input-label font-sans">رقم الهاتف الراسل (Vodafone Cash) أو الحساب <span className="required">*</span></label>
                      <input 
                        type="text" 
                        name="senderNumber"
                        value={formData.senderNumber}
                        onChange={handleInputChange}
                        placeholder="مثال: رقم المحفظة التي قمت بالتحويل منها"
                        className={`form-input-field ${errors.senderNumber ? "input-error" : ""}`}
                      />
                      {errors.senderNumber && <span className="error-message">{errors.senderNumber}</span>}
                    </div>

                    {/* Sender Account Owner Name */}
                    <div className="input-group-wrapper">
                      <label className="input-label font-sans">اسم المرسل صاحب الحساب <span className="required">*</span></label>
                      <input 
                        type="text" 
                        name="senderName"
                        value={formData.senderName}
                        onChange={handleInputChange}
                        placeholder="الاسم المسجل على حساب المحفظة/البنك"
                        className={`form-input-field ${errors.senderName ? "input-error" : ""}`}
                      />
                      {errors.senderName && <span className="error-message">{errors.senderName}</span>}
                    </div>
                  </div>

                  {/* Receipt File Upload */}
                  <div className="input-group-wrapper mb-6">
                    <label className="input-label font-sans">صورة التحويل / إيصال الدفع البنكي <span className="required">*</span></label>
                    <div className={`file-upload-dropzone ${errors.receipt ? "dropzone-error" : ""}`}>
                      <input 
                        type="file" 
                        id="receipt-upload"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden-file-input"
                      />
                      <label htmlFor="receipt-upload" className="dropzone-label">
                        <svg className="upload-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="dropzone-title">اضغط هنا لرفع صورة إيصال التحويل</span>
                        <span className="dropzone-sub">صيغ الصور المدعومة: PNG, JPG, JPEG (بحد أقصى 5 ميجا)</span>
                      </label>
                    </div>
                    {errors.receipt && <span className="error-message mt-2">{errors.receipt}</span>}

                    {/* Image Preview Container */}
                    {formData.receiptPreview && (
                      <div className="image-preview-container mt-4 p-4 border border-gray-200 rounded-xl relative bg-gray-50 flex items-center justify-center">
                        <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-gray-300">
                          <img 
                            src={formData.receiptPreview} 
                            alt="إيصال التحويل" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({ ...prev, receiptFile: null, receiptPreview: "" }))}
                          className="remove-preview-btn"
                          title="حذف الصورة"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                {errors.submit && (
                  <div className="error-message mb-4 block text-center bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-sans text-sm">
                    {errors.submit}
                  </div>
                )}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="submit-checkout-btn w-full"
                >
                  {isSubmitting ? (
                    <div className="flex justify-center items-center gap-2">
                      <div className="spinner-loader"></div>
                      <span>جاري معالجة طلبك وتأكيده...</span>
                    </div>
                  ) : (
                    <span>تأكيد وتسجيل طلبك الآن</span>
                  )}
                </button>
              </form>

              {/* Right Column: Cart Summary (5 cols on lg) */}
              <div className="lg:col-span-5 bg-[#0f3b2e] border-2 border-[#ebdcb9] text-white p-6 md:p-8 rounded-2xl shadow-lg sticky-aside text-right">
                <h3 className="font-serif text-2xl font-bold text-[#ebdcb9] border-b border-[rgba(197,168,128,0.2)] pb-4 mb-6">ملخص طلبياتك</h3>
                
                {/* Cart list items */}
                <div className="summary-items-list mb-6 max-h-[300px] overflow-y-auto pr-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="summary-item-card flex gap-4 border-b border-[rgba(197,168,128,0.15)] pb-4 mb-4">
                      <div className="summary-item-img-container">
                        <Image 
                          src={item.image} 
                          alt={item.title} 
                          width={48} 
                          height={60} 
                          className="summary-item-img object-cover rounded"
                        />
                      </div>
                      <div className="summary-item-details flex-grow flex flex-col justify-between">
                        <h4 className="font-serif text-sm font-bold text-[#ebdcb9] leading-tight m-0">{item.title}</h4>
                        <div className="flex justify-between items-center text-xs text-white/70 font-sans mt-2">
                          <span>الكمية: {item.quantity}</span>
                          <span className="font-semibold text-[#c5a880]">{item.price * item.quantity} ج.م</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="financial-summary-table font-sans">
                  <div className="flex justify-between text-sm text-white/80 mb-3">
                    <span>إجمالي ثمن المنتجات:</span>
                    <span>{cartTotal} ج.م</span>
                  </div>
                  <div className="flex justify-between text-sm text-white/80 mb-3">
                    <span>تكلفة الشحن والتسليم:</span>
                    <span className="text-[#ebdcb9] font-serif">{SHIPPING_FEE} ج.م</span>
                  </div>
                  
                  <div className="border-t border-[rgba(197,168,128,0.25)] my-4 pt-4">
                    <div className="flex justify-between text-lg font-bold text-[#ebdcb9] mb-4">
                      <span>إجمالي الفاتورة الكلي:</span>
                      <span>{grandTotal} ج.م</span>
                    </div>
                  </div>

                  {/* Highlighted Deposit Breakdown */}
                  <div className="bg-[#0b2920] border border-[rgba(197,168,128,0.3)] rounded-xl p-4 mb-4">
                    <div className="flex justify-between text-[#ebdcb9] font-bold text-sm mb-2">
                      <span>الدفعة المقدمة المطلوبة:</span>
                      <span className="text-[#c5a880] text-base">{depositAmount} ج.م</span>
                    </div>
                    <div className="flex justify-between text-white/70 text-xs">
                      <span>المتبقي عند استلام الشحنة:</span>
                      <span>{remainingAmount} ج.م</span>
                    </div>
                  </div>

                  <div className="text-center text-xs text-white/60 leading-relaxed mt-4 font-sans">
                    * سيتم مراجعة إيصال الدفع المرفق خلال دقائق وتجهيز شحنتك فور تأكيد التحويل.
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
