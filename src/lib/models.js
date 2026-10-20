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
export const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
