import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
  },
  { _id: false },
);

const categorySchema = new mongoose.Schema(
  {
    nameAr: { type: String, required: true, trim: true },
    nameEn: { type: String, required: true, trim: true },
    descriptionAr: { type: String, required: true, trim: true },
    descriptionEn: { type: String, required: true, trim: true },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    isActive: { type: Boolean, default: true },
    image: { type: imageSchema, default: null },
  },
  { timestamps: true },
);

const colorSchema = new mongoose.Schema(
  {
    nameAr: { type: String, required: true, trim: true },
    nameEn: { type: String, required: true, trim: true },
    hex: { type: String, required: true, default: "#1e201e" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const announcementSchema = new mongoose.Schema(
  {
    text: { type: String, default: "" },
    textAr: { type: String, default: "" },
    textEn: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const sizeSchema = new mongoose.Schema(
  {
    nameAr: { type: String, required: true, trim: true },
    nameEn: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const variantSchema = new mongoose.Schema(
  {
    size: { type: mongoose.Schema.Types.ObjectId, ref: "Size", default: null },
    color: { type: mongoose.Schema.Types.ObjectId, ref: "Color", default: null },
    stock: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const productSchema = new mongoose.Schema(
  {
    nameAr: { type: String, required: true, trim: true },
    nameEn: { type: String, required: true, trim: true },
    descriptionAr: { type: String, required: true, trim: true },
    descriptionEn: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    images: { type: [imageSchema], default: [] },
    colors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Color" }],
    sizes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Size" }],
    variants: { type: [variantSchema], default: [] },
  },
  { timestamps: true },
);

categorySchema.index({ parent: 1, nameAr: 1 });
productSchema.index({ category: 1, createdAt: -1 });

export const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);
export const Color =
  mongoose.models.Color || mongoose.model("Color", colorSchema);
export const Size = mongoose.models.Size || mongoose.model("Size", sizeSchema);
if (mongoose.models.Announcement && !mongoose.models.Announcement.schema.path("textEn")) {
  mongoose.deleteModel("Announcement");
}
export const Announcement =
  mongoose.models.Announcement ||
  mongoose.model("Announcement", announcementSchema);
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    name: { type: String, default: "" },
    price: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: "" },
    sizeId: { type: String, default: "" },
    colorId: { type: String, default: "" },
    sizeName: { type: String, default: "" },
    colorName: { type: String, default: "" },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    governorate: { type: String, required: true },
    detailedAddress: { type: String, required: true },
    transferPhone: { type: String, default: "" },
    notes: { type: String, default: "" },
    items: { type: [orderItemSchema], default: [] },
    totalPrice: { type: Number, required: true, min: 0 },
    transferImage: { type: imageSchema, default: null },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    completedAt: { type: Date, default: null },
    whatsapp: {
      status: { type: String, default: "" },
      messageId: { type: String, default: "" },
      error: { type: String, default: "" },
      sentAt: { type: Date, default: null },
      reply: { type: String, default: "" },
      repliedAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

const beonEventSchema = new mongoose.Schema(
  {
    event: { type: String, default: "" },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    matchedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    reply: { type: String, default: "" },
  },
  { timestamps: true },
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ customerPhone: 1, createdAt: -1 });

export const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export const BeonEvent =
  mongoose.models.BeonEvent || mongoose.model("BeonEvent", beonEventSchema);
