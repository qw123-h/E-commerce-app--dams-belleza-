type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiRule = {
  prefix: string;
  readPermission?: string;
  writePermission?: string;
};

type PageRule = {
  prefix: string;
  permission: string;
};

const API_RULES: ApiRule[] = [
  {prefix: "/api/products", readPermission: "products.read", writePermission: "products.write"},
  {prefix: "/api/orders", readPermission: "orders.read", writePermission: "orders.write"},
  {prefix: "/api/payments", readPermission: "payments.review", writePermission: "payments.review"},
  {prefix: "/api/reports", readPermission: "reports.read", writePermission: "reports.read"},
  {prefix: "/api/delivery", readPermission: "orders.read", writePermission: "orders.write"},
  {prefix: "/api/roles", readPermission: "roles.manage", writePermission: "roles.manage"},
  {prefix: "/api/users", readPermission: "roles.manage", writePermission: "roles.manage"},
];

const PAGE_RULES: PageRule[] = [
  {prefix: "/admin", permission: "reports.read"},
  {prefix: "/admin/products", permission: "products.read"},
  {prefix: "/admin/orders", permission: "orders.read"},
  {prefix: "/admin/payments", permission: "payments.review"},
  {prefix: "/admin/customers", permission: "orders.read"},
  {prefix: "/admin/delivery", permission: "orders.write"},
  {prefix: "/admin/reports", permission: "reports.read"},
  {prefix: "/admin/roles", permission: "roles.manage"},
];

const PUBLIC_PATHS = new Set<string>([
  "/",
  "/products",
  "/checkout",
  "/checkout/success",
  "/track-order",
  "/unauthorized",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

export function stripLocalePath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length) {
    return "/";
  }

  if (segments[0] === "en" || segments[0] === "fr") {
    return `/${segments.slice(1).join("/")}` || "/";
  }

  return pathname;
}

export function isPublicPagePath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

export function getPageRequiredPermission(pathname: string): string | null {
  const matches = PAGE_RULES.filter((rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`));

  if (!matches.length) {
    return null;
  }

  matches.sort((a, b) => b.prefix.length - a.prefix.length);
  return matches[0].permission;
}

export function getApiRequiredPermission(pathname: string, method: string): string | null {
  const normalizedMethod = method.toUpperCase() as HttpMethod;
  const matched = API_RULES.find((rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`));

  if (!matched) {
    return null;
  }

  if (normalizedMethod === "GET") {
    return matched.readPermission ?? null;
  }

  return matched.writePermission ?? matched.readPermission ?? null;
}
