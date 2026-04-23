import {NextRequest, NextResponse} from "next/server";
import {getToken} from "next-auth/jwt";
import createMiddleware from "next-intl/middleware";
import {routing} from "./i18n/routing";
import {
  getApiRequiredPermission,
  getPageRequiredPermission,
  isAuthOnlyApiPath,
  isAuthPagePath,
  isAuthenticatedPagePath,
  isPublicPagePath,
  stripLocalePath,
} from "@/lib/access-control";

const intlMiddleware = createMiddleware(routing);

function inferLocale(pathname: string) {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  if (firstSegment === "en" || firstSegment === "fr") {
    return firstSegment;
  }

  return routing.defaultLocale;
}

export default async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (pathname.startsWith("/api")) {
    const requiredPermission = getApiRequiredPermission(pathname, request.method);

    if (requiredPermission && !token?.sub) {
      return NextResponse.json({message: "Unauthorized"}, {status: 401});
    }

    if (requiredPermission) {
      const permissions = Array.isArray(token?.permissions) ? token.permissions : [];
      if (!permissions.includes(requiredPermission)) {
        return NextResponse.json({message: "Forbidden"}, {status: 403});
      }

      return NextResponse.next();
    }

    if (isAuthOnlyApiPath(pathname) && !token?.sub) {
      return NextResponse.json({message: "Unauthorized"}, {status: 401});
    }

    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(request);

  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  const normalizedPath = stripLocalePath(pathname);

  if (isPublicPagePath(normalizedPath)) {
    return intlResponse;
  }

  const locale = inferLocale(pathname);
  const callbackUrl = `${pathname}${request.nextUrl.search}`;

  if (isAuthenticatedPagePath(normalizedPath) && !token?.sub) {
    const signInUrl = new URL(`/${locale}/auth/sign-in`, request.url);
    signInUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthPagePath(normalizedPath) && token?.sub) {
    return NextResponse.redirect(new URL(`/${locale}/account`, request.url));
  }

  const requiredPermission = getPageRequiredPermission(normalizedPath);

  if (!requiredPermission) {
    return intlResponse;
  }

  if (!token?.sub) {
    const signInUrl = new URL(`/${locale}/auth/sign-in`, request.url);
    signInUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(signInUrl);
  }

  const permissions = Array.isArray(token.permissions) ? token.permissions : [];

  if (!permissions.includes(requiredPermission)) {
    return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url));
  }

  return intlResponse;
}

export const config = {
  matcher: ["/", "/(en|fr)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
