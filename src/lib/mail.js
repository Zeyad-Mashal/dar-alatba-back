import { Resend } from "resend";
import { ApiError } from "./http";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new ApiError("إعداد البريد غير مكتمل", 500);
  return new Resend(apiKey);
}

function fromAddress() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    "دار الأطباء <noreply@daralatba.com>"
  );
}

export async function sendPasswordResetCode({ to, code, name }) {
  const resend = getResend();
  const safeName = String(name || "").trim() || "عميلنا";
  const subject = "رمز استعادة كلمة المرور - دار الأطباء";
  const html = `
    <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.7;color:#111;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 12px;font-size:20px">دار الأطباء</h2>
      <p style="margin:0 0 12px">مرحباً ${safeName}،</p>
      <p style="margin:0 0 12px">استخدم الرمز التالي لاستعادة كلمة المرور. صالح لمدة 10 دقائق:</p>
      <p style="margin:16px 0;font-size:32px;letter-spacing:8px;font-weight:700">${code}</p>
      <p style="margin:0 0 8px;color:#555;font-size:14px">لو ما طلبتش استعادة كلمة المرور، تجاهل الرسالة دي.</p>
    </div>
  `;
  const text = `رمز استعادة كلمة المرور: ${code}\nصالح لمدة 10 دقائق.`;

  const { data, error } = await resend.emails.send({
    from: fromAddress(),
    to: [to],
    subject,
    html,
    text,
  });

  if (error) {
    throw new ApiError(error.message || "تعذر إرسال الإيميل", 502);
  }
  return data;
}
