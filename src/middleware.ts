import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const url = req.nextUrl;

    // Get hostname (e.g. pinnacle-academia.com, shop.pinnacle-academia.com, localhost:3000)
    const hostname = req.headers.get("host") || "";

    // Remove port if present
    const domain = hostname.split(":")[0];

    // Define restricted subdomains that should NOT be rewritten to /store
    const restrictedSubdomains = ["www", "app", "localhost"];

    // Logic for pinnacle-academia.com subdomains
    if (domain.endsWith(".pinnacle-academia.com") && domain !== "pinnacle-academia.com") {
        const subdomain = domain.replace(".pinnacle-academia.com", "");

        // If it's a restricted subdomain (like www.pinnacle-academia.com), let it pass through (don't rewrite to store)
        if (restrictedSubdomains.includes(subdomain)) {
            return NextResponse.next();
        }

        // Rewrite to the store path
        // e.g. shop.pinnacle-academia.com/syllabus -> pinnacle-academia.com/store/shop/syllabus
        console.log(`[Middleware] Rewriting subdomain ${subdomain} to /store/${subdomain}`);
        url.pathname = `/store/${subdomain}${url.pathname}`;
        return NextResponse.rewrite(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all paths except for:
         * 1. /api routes
         * 2. /_next (Next.js internals)
         * 3. /_static (inside /public)
         * 4. all root files inside /public (e.g. /favicon.ico)
         */
        "/((?!api/|_next/|_vercel/|_static/|[\\w-]+\\.\\w+).*)",
    ],
};
