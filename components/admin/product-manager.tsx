"use client";

import {useState, useTransition} from "react";
import {ProductType, PriceMode} from "@prisma/client";
import {extractSizePricing} from "@/lib/product-pricing";

type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  productType: ProductType;
  priceMode: PriceMode;
  salePrice: number | null;
  costPrice: number | null;
  currency: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  category?: {
    id: string;
    name: string;
  };
  stock?: {
    quantityOnHand: number;
  } | null;
  images?: Array<{
    url: string;
    altText: string | null;
  }>;
};

type Labels = {
  [key: string]: string;
};

type Props = {
  products: Product[];
  labels: Labels;
};

export function ProductManager({products: initialProducts, labels}: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [message, setMessage] = useState<{type: "success" | "error"; text: string} | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    productType: "WIG" as ProductType,
    salePrice: "" as number | "",
    imageUrls: [] as string[],
    quantityOnHand: "" as number | "",
    isPublished: true,
  });

  function resetForm() {
    setFormData({
      name: "",
      description: "",
      productType: "WIG",
      salePrice: "",
      imageUrls: [],
      quantityOnHand: "",
      isPublished: true,
    });
  }

  async function handleFileUpload(files: File[]) {
    if (files.length === 0) {
      return;
    }

    setIsUploadingImage(true);
    setMessage(null);

    try {
      const uploadedUrls: string[] = [];
      let hasUploadError = false;

      for (const file of files) {
        const payload = new FormData();
        payload.append("file", file);

        const response = await fetch("/api/products/upload", {
          method: "POST",
          body: payload,
        });

        if (!response.ok) {
          hasUploadError = true;
          continue;
        }

        const result = await response.json();
        if (typeof result?.url === "string" && result.url.trim()) {
          uploadedUrls.push(result.url);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          imageUrls: Array.from(new Set([...prev.imageUrls, ...uploadedUrls])),
        }));
      }

      if (hasUploadError) {
        setMessage({type: "error", text: labels.errorUpload});
      }
    } catch {
      setMessage({type: "error", text: labels.errorUpload});
    } finally {
      setIsUploadingImage(false);
    }
  }

  function handleSave() {
    const salePrice = Number(formData.salePrice);
    const quantityOnHand = Number(formData.quantityOnHand || 0);

    if (!formData.name.trim() || !Number.isFinite(salePrice) || salePrice <= 0) {
      setMessage({type: "error", text: labels.errorCreate});
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          ...formData,
          salePrice,
          quantityOnHand,
          priceMode: "FIXED" as PriceMode,
          currency: "XAF",
        }),
      });

      if (response.ok) {
        const {data} = await response.json();
        setProducts([data, ...products]);
        setMessage({type: "success", text: labels.successCreated});
        resetForm();
        setShowForm(false);
        setTimeout(() => setMessage(null), 3000);
      } else {
        const {error} = await response.json();
        if (error?.includes("already exists")) {
          setMessage({type: "error", text: labels.errorDuplicate});
        } else if (error === "Invalid product data") {
          setMessage({type: "error", text: labels.errorCreate});
        } else if (typeof error === "string" && error.trim()) {
          setMessage({type: "error", text: error});
        } else {
          setMessage({type: "error", text: labels.errorCreate});
        }
      }
    });
  }

  function handleDelete(productId: string) {
    if (!confirm(labels.confirmDeleteMessage)) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== productId));
        setMessage({type: "success", text: labels.successDeleted});
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({type: "error", text: labels.errorDelete});
      }
    });
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            message.type === "success"
              ? "border border-green-500/30 bg-green-50 text-green-800"
              : "border border-red-500/30 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        onClick={() => {
          setShowForm(!showForm);
          if (!showForm) resetForm();
        }}
        className="rounded-xl bg-charcoal-900 px-4 py-2 text-sm font-semibold text-cream-50"
      >
        {showForm ? labels.cancel : labels.addProduct}
      </button>

      {showForm && (
        <article className="space-y-4 rounded-3xl border border-charcoal-900/10 bg-cream-50 p-5">
          <h2 className="font-display text-2xl text-charcoal-900">{labels.addProduct}</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder={labels.productName}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm"
            />

            <select
              value={formData.productType}
              onChange={(e) => setFormData({...formData, productType: e.target.value as ProductType})}
              className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm"
            >
              <option value="WIG">{labels.wig}</option>
              <option value="PERFUME">{labels.perfume}</option>
            </select>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-charcoal-700">{labels.salePrice}</label>
              <input
                type="number"
                min={1}
                placeholder={labels.salePricePlaceholder}
                value={formData.salePrice}
                onChange={(e) => setFormData({...formData, salePrice: e.target.value === "" ? "" : Number(e.target.value)})}
                className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm"
              />
              <p className="text-xs text-charcoal-600">{labels.salePriceHelp}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-charcoal-700">{labels.quantityOnHand}</label>
              <input
                type="number"
                min={0}
                placeholder={labels.quantityPlaceholder}
                value={formData.quantityOnHand}
                onChange={(e) => setFormData({...formData, quantityOnHand: e.target.value === "" ? "" : Number(e.target.value)})}
                className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm"
              />
              <p className="text-xs text-charcoal-600">{labels.quantityHelp}</p>
            </div>

            <label className="flex items-center justify-center rounded-xl border border-dashed border-charcoal-900/25 bg-white px-3 py-2 text-sm text-charcoal-700">
              {isUploadingImage ? labels.uploadingImage : labels.selectImage}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (files.length > 0) {
                    void handleFileUpload(files);
                  }
                }}
              />
            </label>
          </div>

          {formData.imageUrls.length > 0 ? (
            <div className="rounded-xl border border-charcoal-900/15 bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-charcoal-700">{labels.previewImage}</p>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({...prev, imageUrls: []}))}
                  className="rounded-lg border border-charcoal-900/20 px-2 py-1 text-xs font-semibold text-charcoal-900"
                >
                  {labels.removeImage}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {formData.imageUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative">
                    <img src={url} alt={`${formData.name || "Product image"} ${index + 1}`} className="h-28 w-28 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          imageUrls: prev.imageUrls.filter((_, i) => i !== index),
                        }))
                      }
                      className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <textarea
            placeholder={labels.description}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm"
            rows={3}
          />

          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
            />
            <span className="text-sm text-charcoal-800">{labels.isPublished}</span>
          </label>

          <button
            onClick={handleSave}
            disabled={isPending || isUploadingImage}
            className="rounded-xl bg-charcoal-900 px-4 py-2 text-sm font-semibold text-cream-50 disabled:opacity-50"
          >
            {isPending ? labels.saving : labels.save}
          </button>
        </article>
      )}

      <div className="overflow-x-auto rounded-3xl border border-charcoal-900/10 bg-cream-50 shadow-lg shadow-charcoal-900/5">
        <table className="min-w-full divide-y divide-charcoal-900/10 text-sm">
          <thead className="bg-cream-100/80">
            <tr>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{labels.sku}</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{labels.name}</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{labels.type}</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{labels.price}</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{labels.stock}</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{labels.status}</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{labels.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-900/10">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-charcoal-900">{product.sku}</td>
                <td className="px-4 py-3 text-charcoal-900">
                  <p className="font-semibold">{product.name}</p>
                  <p className="mt-1 text-xs text-charcoal-600">{product.category?.name}</p>
                </td>
                <td className="px-4 py-3 text-charcoal-700">
                  <span className="inline-block rounded-full bg-charcoal-900/10 px-2 py-1 text-xs font-semibold">{product.productType}</span>
                </td>
                <td className="px-4 py-3 text-charcoal-900">
                  {(() => {
                    const directPrice = product.salePrice;
                    if (directPrice) {
                      return `${product.currency} ${directPrice.toLocaleString()}`;
                    }

                    const sizePricing = extractSizePricing(`${product.name}\n${product.description ?? ""}`);
                    const minimumVariantPrice = sizePricing.length > 0 ? Math.min(...sizePricing.map((entry) => entry.price)) : null;

                    if (minimumVariantPrice) {
                      return `${product.currency} ${minimumVariantPrice.toLocaleString()}`;
                    }

                    return "-";
                  })()}
                </td>
                <td className="px-4 py-3 text-charcoal-900">
                  {product.stock?.quantityOnHand ?? 0}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                      product.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {product.isPublished ? labels.published : labels.draft}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={isPending}
                    className="text-red-600 hover:text-red-700 disabled:opacity-50 text-xs font-semibold"
                  >
                    {labels.delete}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-charcoal-600">{labels.noItems || "No products found"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
