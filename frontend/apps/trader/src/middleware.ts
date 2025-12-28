import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
    "/landing",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/watchlist(.*)", // Make watchlist API routes public for now
    "/api/stocks(.*)", // Make stocks API routes public
    "/api/quote(.*)", // Make quote API routes public
    "/api/historical-price(.*)", // Make historical price API routes public
    "/api/company-overview(.*)", // Make company overview API routes public
    "/api/stock-news(.*)", // Make stock news API routes public
    "/api/alerts/send"
]);

export default clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};

