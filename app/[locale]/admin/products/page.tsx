import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {ProductManager} from "@/components/admin/product-manager";
import {listAdminProducts} from "@/lib/admin-products";
import {requirePermission} from "@/lib/guards";
import {routing} from "@/i18n/routing";

export default async function AdminProductsPage({
  params,
}: {
  params?: {locale: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const session = await requirePermission("products.read");

  if (!session) {
    redirect(`/${locale}/unauthorized`);
  }

  const [t, products] = await Promise.all([
    getTranslations({locale, namespace: "adminProducts"}),
    listAdminProducts(),
  ]);

  // Convert Prisma Decimal types to numbers
  const productsWithNumbers = products.map((p) => ({
    ...p,
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    costPrice: p.costPrice ? Number(p.costPrice) : null,
  }));

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-charcoal-900/10 bg-cream-50 px-6 py-7 shadow-lg shadow-charcoal-900/5">
        <h1 className="font-display text-4xl text-charcoal-900">{t("title")}</h1>
        <p className="mt-2 text-charcoal-700">{t("subtitle")}</p>
      </header>

      <ProductManager
        products={productsWithNumbers}
        labels={{
          title: t("title"),
          subtitle: t("subtitle"),
          search: t("search"),
          filter: t("filter"),
          type: t("type"),
          category: t("category"),
          sku: t("sku"),
          name: t("name"),
          price: t("price"),
          cost: t("cost"),
          stock: t("stock"),
          status: t("status"),
          published: t("published"),
          draft: t("draft"),
          actions: t("actions"),
          edit: t("edit"),
          delete: t("delete"),
          addProduct: t("addProduct"),
          productName: t("productName"),
          productType: t("productType"),
          wig: t("productTypeWig"),
          perfume: t("productTypePerfume"),
          description: t("description"),
          salePrice: t("salePrice"),
          salePricePlaceholder: t("salePricePlaceholder"),
          salePriceHelp: t("salePriceHelp"),
          quantityOnHand: t("quantityOnHand"),
          quantityPlaceholder: t("quantityPlaceholder"),
          quantityHelp: t("quantityHelp"),
          selectImage: t("selectImage"),
          uploadingImage: t("uploadingImage"),
          previewImage: t("previewImage"),
          removeImage: t("removeImage"),
          errorUpload: t("errorUpload"),
          save: t("save"),
          saving: t("saving"),
          cancel: t("cancel"),
          deleting: t("deleting"),
          isPublished: t("isPublished"),
          successCreated: t("successCreated"),
          successUpdated: t("successUpdated"),
          successDeleted: t("successDeleted"),
          errorCreate: t("errorCreate"),
          errorUpdate: t("errorUpdate"),
          errorDelete: t("errorDelete"),
          errorDuplicate: t("errorDuplicate"),
          confirmDelete: t("confirmDelete"),
          confirmDeleteMessage: t("confirmDeleteMessage"),
        }}
      />
    </section>
  );
}
