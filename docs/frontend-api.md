# دليل ربط الفرونت — دار الأطباء

الـ API خاص بالأقسام (رئيسي وفرعي)، الألوان، المقاسات، والمنتجات. كل النصوص الأساسية موجودة بالعربي والإنجليزي.

## 1. العنوان الأساسي

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com
```

من غير شرطة في الآخر. المسارات على جذر السيرفر، مش تحت `/api`.

```txt
https://your-backend-domain.com/getAllProducts
https://your-backend-domain.com/getProductDetails/PRODUCT_ID
```

لو الفرونت والباك على نفس الدومين، سيب المتغير فاضي والطلبات تبقى نسبية: `/getAllProducts`.

## 2. شكل الرد

النجاح:

```json
{
  "success": true,
  "message": "تم جلب المنتجات",
  "data": []
}
```

الخطأ:

```json
{
  "success": false,
  "message": "القسم المختار غير موجود"
}
```

`data` في القراءة مصفوفة أو كائن. في الحذف كائن صغير فيه `_id` أو أعداد المحذوفات. اعرض `message` للمستخدم كما هي، لأنها بالعربي.

دالة جاهزة:

```js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function apiRequest(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "تعذر إتمام الطلب");
  }
  return payload.data;
}
```

مهم: مع `FormData` لا ترسل `Content-Type`. المتصفح يضيفه ومعاه الحد الفاصل للملفات. مع الألوان والمقاسات فقط أرسل `Content-Type: application/json`.

## 3. اللغة

| الحقل في الرد | المعنى |
| --- | --- |
| `nameAr` / `descriptionAr` | العربي |
| `nameEn` / `descriptionEn` | الإنجليزي |
| `name` / `description` | نسخة عربية جاهزة، نفس `nameAr` و `descriptionAr` |

في واجهة عربي اعرض `nameAr`. في واجهة إنجليزي اعرض `nameEn`. لا تعتمد على `name` وحدها لو الموقع هيبقى ثنائي اللغة.

## 4. الأقسام

مستويان فقط:

- قسم رئيسي: `parent = null` و `isMain = true`.
- قسم فرعي: `parent` كائن فيه `_id` و `nameAr` و `nameEn` و `isActive`.
- لا يوجد مستوى ثالث. القسم الفرعي لا يقبل أبناء.

### جلب كل الأقسام

`GET /getAllCategories`

```json
{
  "_id": "MAIN_ID",
  "name": "ملابس",
  "nameAr": "ملابس",
  "nameEn": "Clothes",
  "description": "قسم الملابس",
  "descriptionAr": "قسم الملابس",
  "descriptionEn": "Clothes section",
  "parent": null,
  "isMain": true,
  "isActive": true,
  "image": { "url": "https://res.cloudinary.com/...", "public_id": "..." },
  "createdAt": "",
  "updatedAt": ""
}
```

قسم فرعي:

```json
{
  "_id": "SUB_ID",
  "nameAr": "تيشيرتات",
  "nameEn": "T-Shirts",
  "parent": {
    "_id": "MAIN_ID",
    "name": "ملابس",
    "nameAr": "ملابس",
    "nameEn": "Clothes",
    "isActive": true
  },
  "isMain": false,
  "isActive": true,
  "image": { "url": "...", "public_id": "..." }
}
```

فصلهم في الفرونت:

```js
const parentId = (category) =>
  category.parent && typeof category.parent === "object"
    ? category.parent._id
    : category.parent || null;

const mains = categories.filter((category) => !parentId(category));
const subsOf = (mainId) =>
  categories.filter((category) => parentId(category) === mainId);
```

في المتجر اعرض القسم فقط لو `isActive !== false`. لو القسم الفرعي نشط وأبوه غير نشط، لا تعرض الفرعي.

### إضافة قسم

`POST /addCategory`  
النوع: `multipart/form-data`

| الحقل | مطلوب | ملاحظة |
| --- | --- | --- |
| `nameAr` | نعم | حتى 160 حرف |
| `nameEn` | نعم | حتى 160 حرف |
| `descriptionAr` | نعم | حتى 4000 حرف |
| `descriptionEn` | نعم | حتى 4000 حرف |
| `parent` | لا | فاضي = قسم رئيسي. غير فاضي = `_id` القسم الرئيسي |
| `isActive` | لا | `"true"` أو `"false"`. الافتراضي نشط |
| `image` | نعم عند الإضافة | ملف صورة، حد أقصى 8 ميجا |

```js
const form = new FormData();
form.append("nameAr", "ملابس");
form.append("nameEn", "Clothes");
form.append("descriptionAr", "قسم الملابس");
form.append("descriptionEn", "Clothes section");
form.append("parent", ""); // أو MAIN_ID للقسم الفرعي
form.append("isActive", "true");
form.append("image", file);

await apiRequest("/addCategory", { method: "POST", body: form });
```

الرد `201` والقسم داخل `data`.

### تعديل قسم

`PUT /updateCategory/:id`  
نفس الحقول. `image` اختياري؛ لو لم تُرسل تبقى الصورة القديمة. الصورة القديمة مطلوبة أن تكون موجودة من قبل.

### حذف قسم

`DELETE /deleteCategory/:id`

يحذف القسم، وأقسامه الفرعية إن كان رئيسياً، وكل المنتجات التابعة لهم وصورهم. الرد:

```json
{ "deletedProducts": 3, "deletedCategories": 2 }
```

## 5. جلب المنتجات حسب القسم

هذا هو الربط المهم بين القسم والمنتج.

`GET /getProductsByCategory/:categoryId`

أو:

`GET /getAllProducts?categoryId=CATEGORY_ID`

`GET /getAllProducts` من غير باراميتر يرجع كل المنتجات.

القاعدة:

- لو المعرف **قسم رئيسي**: المنتجات المحفوظة عليه مباشرة + منتجات كل أقسامه الفرعية.
- لو المعرف **قسم فرعي**: منتجات هذا الفرعي فقط. منتج محفوظ على الأب لا يظهر هنا.

```js
async function getProducts(categoryId) {
  if (!categoryId || categoryId === "all") {
    return apiRequest("/getAllProducts");
  }
  return apiRequest(`/getProductsByCategory/${categoryId}`);
}
```

الفلترة دي تحصل على السيرفر. مش محتاج تحسب الأبناء في الفرونت عشان تجيب المنتجات. حساب الأبناء في الفرونت مفيد فقط لرسم الشجرة وعدد المنتجات بجانب اسم القسم.

منتج داخل قسم غير نشط يرجع من الأدمن مع `isActive`. في واجهة العملاء صفِّ بنفسك:

```js
const visible = products.filter((product) => product.isActive !== false);
```

واخفِ المنتج لو قسمه أو القسم الأب غير نشط.

## 6. الألوان والمقاسات

دول كتالوج عام. المنتج لا يخترع لوناً أو مقاساً جديداً؛ يختار من الموجود.

### الألوان

| الطريقة | المسار |
| --- | --- |
| جلب | `GET /getAllColors` |
| إضافة | `POST /addColor` |
| تعديل | `PUT /updateColor/:id` |
| حذف | `DELETE /deleteColor/:id` |

الإضافة والتعديل JSON:

```json
{
  "nameAr": "أسود",
  "nameEn": "Black",
  "hex": "#111111",
  "isActive": true
}
```

`hex` اختياري. لو فاضي يصير `#1e201e`. الصيغة المقبولة `#RRGGBB` فقط.

الرد:

```json
{
  "_id": "COLOR_ID",
  "name": "أسود",
  "nameAr": "أسود",
  "nameEn": "Black",
  "hex": "#111111",
  "sortOrder": 0,
  "isActive": true
}
```

### المقاسات

| الطريقة | المسار |
| --- | --- |
| جلب | `GET /getAllSizes` |
| إضافة | `POST /addSize` |
| تعديل | `PUT /updateSize/:id` |
| حذف | `DELETE /deleteSize/:id` |

```json
{
  "nameAr": "كبير جداً",
  "nameEn": "XL",
  "isActive": true
}
```

الاسم العربي حتى 60 حرفاً للون و 40 للمقاس. الاسم الإنجليزي نفس الحد. الاسم العربي أو الإنجليزي لا يتكرر.

الحذف يرفض لو اللون أو المقاس مستخدم في منتج:

```json
{ "success": false, "message": "لا يمكن حذف اللون لأنه مستخدم في منتج" }
```

في فورم المنتج اعرض العناصر النشطة فقط: `isActive !== false`.

## 7. المنتج

### شكل المنتج في كل رد

```json
{
  "_id": "PRODUCT_ID",
  "name": "تيشيرت",
  "nameAr": "تيشيرت",
  "nameEn": "T-Shirt",
  "description": "وصف عربي",
  "descriptionAr": "وصف عربي",
  "descriptionEn": "English description",
  "price": 250,
  "stock": 19,
  "isActive": true,
  "categoryPath": "ملابس / تيشيرتات",
  "category": {
    "_id": "SUB_ID",
    "nameAr": "تيشيرتات",
    "nameEn": "T-Shirts",
    "parent": {
      "_id": "MAIN_ID",
      "nameAr": "ملابس",
      "nameEn": "Clothes",
      "isActive": true
    },
    "isMain": false,
    "isActive": true
  },
  "images": [
    { "url": "https://res.cloudinary.com/...", "public_id": "..." }
  ],
  "colors": [
    { "_id": "BLACK_ID", "nameAr": "أسود", "nameEn": "Black", "hex": "#111111", "isActive": true }
  ],
  "sizes": [
    { "_id": "XL_ID", "nameAr": "كبير جداً", "nameEn": "XL", "sortOrder": 1, "isActive": true }
  ],
  "variants": [
    {
      "_id": "VARIANT_ID",
      "stock": 4,
      "size": { "_id": "XL_ID", "nameAr": "كبير جداً", "nameEn": "XL" },
      "color": { "_id": "BLACK_ID", "nameAr": "أسود", "nameEn": "Black", "hex": "#111111" }
    },
    {
      "_id": "VARIANT_ID_2",
      "stock": 15,
      "size": { "_id": "XL_ID", "nameAr": "كبير جداً", "nameEn": "XL" },
      "color": { "_id": "WHITE_ID", "nameAr": "أبيض", "nameEn": "White", "hex": "#ffffff" }
    }
  ]
}
```

`stock` على المنتج هو مجموع كميات الخانات. في المثال 4 + 15 = 19. العميل لا يشتري من هذا الرقم مباشرة؛ يشتري من كمية المقاس مع اللون الذي اختاره.

`category` ممكن يكون القسم الرئيسي أو الفرعي. `categoryPath` جاهز للعرض: `ملابس / تيشيرتات` أو `ملابس` لو المنتج على الرئيسي.

### جلب منتج واحد

`GET /getProductDetails/:id`

`data` هو كائن المنتج. لو غير موجود: `404` والرسالة `المنتج غير موجود`.

### إضافة منتج

`POST /addProduct`  
`multipart/form-data`  
الرد `201`.

| الحقل | مطلوب | ملاحظة |
| --- | --- | --- |
| `nameAr` | نعم | حتى 160 |
| `nameEn` | نعم | حتى 160 |
| `descriptionAr` | نعم | حتى 4000 |
| `descriptionEn` | نعم | حتى 4000 |
| `price` | نعم | رقم ≥ 0 |
| `category` | نعم | `_id` قسم رئيسي أو فرعي |
| `isActive` | لا | `"true"` / `"false"` |
| `images` | نعم عند الإضافة | من 1 إلى 5 صور. المفتاح يتكرر لكل صورة |
| `colorIds` | لا | نص JSON لمصفوفة معرفات |
| `sizeIds` | لا | نص JSON لمصفوفة معرفات |
| `variants` | عند وجود لون أو مقاس | نص JSON لجدول الكميات |
| `stock` | لو لا يوجد لون ولا مقاس | عدد صحيح ≥ 0. لو فاضي يتحسب 0 |

### تعديل منتج

`PUT /updateProduct/:id`

نفس الحقول. الصور:

- لو لم ترسل `images`، الصور القديمة تبقى.
- لو أرسلت `images`، المجموعة الجديدة تستبدل القديمة بالكامل. أعد إرسال الصور التي تريد بقاءها، بحد 5.

### حذف منتج

`DELETE /deleteProduct/:id`

يحذف المنتج وصوره.

### جدول الكميات

كل مقاس مختار × كل لون مختار = خانة واحدة، والكمية عدد صحيح من صفر وطالع.

مثال: مقاس XL، لون أسود 4، لون أبيض 15.

```js
form.append("colorIds", JSON.stringify(["BLACK_ID", "WHITE_ID"]));
form.append("sizeIds", JSON.stringify(["XL_ID"]));
form.append("variants", JSON.stringify([
  { sizeId: "XL_ID", colorId: "BLACK_ID", stock: 4 },
  { sizeId: "XL_ID", colorId: "WHITE_ID", stock: 15 },
]));
```

ثلاث حالات:

1. **مقاس ولون:** صف لكل مقاس، وعمود لكل لون. كل تقاطع له `stock`.
2. **مقاسات فقط:** `colorIds = []`، وكل خانة `{ sizeId, colorId: null, stock }`.
3. **ألوان فقط:** `sizeIds = []`، وكل خانة `{ sizeId: null, colorId, stock }`.
4. **من غير الاتنين** (كتاب مثلاً): `colorIds = "[]"` و `sizeIds = "[]"` و `variants = "[]"` و `stock = "7"`.

عدد عناصر `variants` لازم يساوي عدد المقاسات × عدد الألوان. خانة ناقصة ترجع:

`أدخل كمية كل مقاس مع كل لون قبل الحفظ`

بناء الجدول قبل الإرسال:

```js
function buildVariants(sizeIds, colorIds, stockMap) {
  const sizes = sizeIds.length ? sizeIds : [null];
  const colors = colorIds.length ? colorIds : [null];
  if (!sizeIds.length && !colorIds.length) return [];

  return sizes.flatMap((sizeId) =>
    colors.map((colorId) => ({
      sizeId,
      colorId,
      stock: Number(stockMap[`${sizeId || ""}|${colorId || ""}`]),
    })),
  );
}
```

`stockMap` مفتاحه `sizeId|colorId` وقيمته الكمية التي كتبها الأدمن.

مثال إضافة كامل:

```js
const form = new FormData();
form.append("nameAr", "تيشيرت");
form.append("nameEn", "T-Shirt");
form.append("descriptionAr", "قطن");
form.append("descriptionEn", "Cotton");
form.append("price", "250");
form.append("category", "SUB_OR_MAIN_ID");
form.append("isActive", "true");
form.append("colorIds", JSON.stringify(["BLACK_ID", "WHITE_ID"]));
form.append("sizeIds", JSON.stringify(["XL_ID"]));
form.append("variants", JSON.stringify([
  { sizeId: "XL_ID", colorId: "BLACK_ID", stock: 4 },
  { sizeId: "XL_ID", colorId: "WHITE_ID", stock: 15 },
]));
imageFiles.forEach((file) => form.append("images", file));

const product = await apiRequest("/addProduct", { method: "POST", body: form });
```

## 8. صفحة المنتج والسلة

1. اجلب `GET /getProductDetails/:id`.
2. اعرض `nameAr` و `nameEn`، و `descriptionAr` و `descriptionEn`.
3. لو `sizes` أو `colors` فيها عناصر، العميل يختار قبل الإضافة للسلة.
4. كمية الاختيار:

```js
function selectedStock(product, sizeId, colorId) {
  const hasOptions = product.sizes.length || product.colors.length;
  if (!hasOptions) return product.stock;

  const variant = product.variants.find((item) => {
    const itemSize = item.size?._id || "";
    const itemColor = item.color?._id || "";
    return itemSize === (sizeId || "") && itemColor === (colorId || "");
  });
  return variant?.stock ?? 0;
}
```

5. امنع الكمية المطلوبة أن تزيد على هذا الرقم. لو الناتج `0` عطّل زر الشراء.
6. سطر السلة لمنتج فيه مقاس أو لون لازم يكون مميزاً عن نفس المنتج بلون آخر:

```js
const lineId = hasVariant
  ? `${product._id}__${sizeId || "none"}__${colorId || "none"}`
  : product._id;
```

احفظ في السلة أيضاً:

```js
{
  id: lineId,
  productId: product._id,
  title: "تيشيرت — كبير جداً / XL / أسود / Black",
  image: product.images[0]?.url,
  price: product.price,
  quantity: 1,
  sizeId: "XL_ID",
  colorId: "BLACK_ID",
  sizeName: "كبير جداً / XL",
  colorName: "أسود / Black"
}
```

منتج بلا مقاس ولا لون يستخدم `product._id` كمفتاح السلة، و `productId` هو نفس المعرف.

في كارت المتجر: لو المنتج فيه `colors` أو `sizes` أو `variants`، لا تضفه للسلة من الكارت. حوّل الزر إلى صفحة التفاصيل حتى يختار العميل الخانة. لو مفيش خيارات والمخزون `0`، عطّل الإضافة.

الصور من Cloudinary. دومين `res.cloudinary.com` مسموح في `next/image`.

## 9. ترتيب شاشات الأدمن

1. أضف الألوان والمقاسات.
2. أضف القسم الرئيسي، ثم الفرعي تحته.
3. أضف المنتج واربطه بأي مستوى، واملأ جدول الكميات.
4. شاشة التفاصيل تعرض الاسمين، الوصفين، السعر، `categoryPath`، الصور، وجدول المقاس / اللون / الكمية.

قائمة الأقسام في فورم المنتج:

```txt
ملابس — رئيسي
تيشيرتات — فرعي
```

## 10. أخطاء متوقعة

| الحالة | الرسالة |
| --- | --- |
| اسم أو وصف ناقص | الحقل المطلوب + `مطلوب` |
| سعر غير صالح | `السعر غير صالح` |
| قسم غير موجود | `القسم المختار غير موجود` أو `القسم غير موجود` |
| قسم فرعي تحت قسم فرعي | `يمكن إضافة الأقسام الفرعية تحت قسم رئيسي فقط` |
| تحويل قسم فيه أبناء إلى فرعي | `لا يمكن تحويل قسم يحتوي أقساماً فرعية إلى قسم فرعي` |
| اسم مكرر في نفس المستوى | `يوجد قسم بنفس الاسم العربي أو الإنجليزي في هذا المستوى` |
| لون أو مقاس مكرر | `يوجد لون بنفس الاسم العربي أو الإنجليزي` |
| كمية ناقصة | `أدخل كمية كل مقاس مع كل لون قبل الحفظ` |
| كمية فيها كسور | `كمية القطعة يجب أن تكون عدداً صحيحاً يبدأ من صفر` |
| بدون صورة عند إضافة منتج | `يجب رفع صورة واحدة على الأقل للمنتج` |
| أكثر من 5 صور | `يمكنك رفع 5 صور كحد أقصى` |
| صورة أكبر من 8 ميجا | `حجم الصورة يجب ألا يتجاوز 8 ميجابايت` |
| ملف ليس صورة | `الملف يجب أن يكون صورة` |
| لون مستخدم | `لا يمكن حذف اللون لأنه مستخدم في منتج` |
| مقاس مستخدم | `لا يمكن حذف المقاس لأنه مستخدم في منتج` |
| معرف غير موجود | `404` مع رسالة بالعربي |

## 11. ملخص المسارات

| الوظيفة | Method | المسار | الجسم |
| --- | --- | --- | --- |
| كل الأقسام | GET | `/getAllCategories` | — |
| إضافة قسم | POST | `/addCategory` | FormData |
| تعديل قسم | PUT | `/updateCategory/:id` | FormData |
| حذف قسم | DELETE | `/deleteCategory/:id` | — |
| كل المنتجات | GET | `/getAllProducts` | — |
| منتجات قسم | GET | `/getProductsByCategory/:id` | — |
| منتجات قسم | GET | `/getAllProducts?categoryId=:id` | — |
| تفاصيل منتج | GET | `/getProductDetails/:id` | — |
| إضافة منتج | POST | `/addProduct` | FormData |
| تعديل منتج | PUT | `/updateProduct/:id` | FormData |
| حذف منتج | DELETE | `/deleteProduct/:id` | — |
| كل الألوان | GET | `/getAllColors` | — |
| إضافة لون | POST | `/addColor` | JSON |
| تعديل لون | PUT | `/updateColor/:id` | JSON |
| حذف لون | DELETE | `/deleteColor/:id` | — |
| كل المقاسات | GET | `/getAllSizes` | — |
| إضافة مقاس | POST | `/addSize` | JSON |
| تعديل مقاس | PUT | `/updateSize/:id` | JSON |
| حذف مقاس | DELETE | `/deleteSize/:id` | — |
