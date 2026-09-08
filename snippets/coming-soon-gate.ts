import { NextResponse, type NextRequest } from "next/server";

// "Coming soon" gate for client review before public launch: anyone without
// a preview cookie is redirected to a placeholder page. The middleware
// matcher below is the fix for a real production bug — the original matcher
// excluded static images by file extension, but not `.js`, so `/sw.js`
// itself was being redirected for gated visitors. That silently broke
// service worker registration site-wide: without an active service worker,
// Chrome never considers a site installable as a PWA. Excluding `sw.js` and
// `manifest.webmanifest` explicitly fixed it.

const PREVIEW_COOKIE = "preview_access";
const PREVIEW_ALLOWED_PATHS = ["/preview", "/coming-soon", "/login", "/app", "/admin"];

function isSiteLaunched() {
  return process.env.SITE_LAUNCHED === "1";
}

export function comingSoonGate(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (isSiteLaunched()) return null;

  const hasPreviewAccess = request.cookies.has(PREVIEW_COOKIE);
  const isAllowedPath = PREVIEW_ALLOWED_PATHS.some((p) => path.startsWith(p));

  if (!hasPreviewAccess && !isAllowedPath) {
    const gateUrl = request.nextUrl.clone();
    gateUrl.pathname = "/coming-soon";
    gateUrl.search = "";
    return NextResponse.redirect(gateUrl);
  }

  return null;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|images/|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
