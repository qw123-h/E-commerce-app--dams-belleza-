import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {RoleManager} from "@/components/admin/role-manager";
import {listRbacData} from "@/lib/admin-rbac";
import {requireAnyRole} from "@/lib/guards";
import {routing} from "@/i18n/routing";

export default async function AdminRolesPage({
  params,
}: {
  params?: {locale: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const session = await requireAnyRole(["super-admin"]);

  if (!session) {
    redirect(`/${locale}/unauthorized`);
  }

  const [t, data] = await Promise.all([
    getTranslations({locale, namespace: "adminRoles"}),
    listRbacData(),
  ]);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-charcoal-900/10 bg-cream-50 px-6 py-7 shadow-lg shadow-charcoal-900/5">
        <h1 className="font-display text-4xl text-charcoal-900">{t("title")}</h1>
        <p className="mt-2 text-charcoal-700">{t("subtitle")}</p>
      </header>

      <RoleManager
        roles={data.roles}
        permissions={data.permissions}
        users={data.users}
        labels={{
          createRole: t("createRole"),
          roleName: t("roleName"),
          roleSlug: t("roleSlug"),
          roleDescription: t("roleDescription"),
          create: t("create"),
          save: t("save"),
          saving: t("saving"),
          permissions: t("permissions"),
          assignUserRole: t("assignUserRole"),
          user: t("user"),
          role: t("role"),
          assign: t("assign"),
          templates: t("templates"),
          templateOwner: t("templateOwner"),
          templateHelper: t("templateHelper"),
          systemRoleLocked: t("systemRoleLocked"),
        }}
      />
    </section>
  );
}
