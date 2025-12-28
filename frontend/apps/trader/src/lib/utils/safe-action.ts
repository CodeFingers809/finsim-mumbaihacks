import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function getCurrentUserId(): Promise<string | null> {
    const { userId } = await auth();
    return userId ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
    const userId = await getCurrentUserId();
    return userId !== null;
}

/**
 * Higher-order function to wrap API route handlers with authentication
 * @param handler - The async function to execute if authenticated
 * @returns NextResponse
 */
export async function withAuth(
    handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
    try {
        const userId = await getCurrentUserId();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized - Please sign in" },
                { status: 401 }
            );
        }

        // Execute the handler with the user ID
        return await handler(userId);
    } catch (error) {
        console.error("Error in withAuth:", error);

        // Handle specific error types
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 404 }
                );
            }
            if (error.message.includes("already exists")) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 409 }
                );
            }
        }

        // Generic error response
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Verify user has access to a specific resource
 */
export async function verifyResourceAccess(
    userId: string,
    resourceUserId: string
): Promise<boolean> {
    // Check if the user owns the resource
    return userId === resourceUserId;
}

/**
 * Check if user has required role/permission
 */
export function hasPermission(userId: string, permission: string): boolean {
    // In production, check user roles/permissions from database
    // For now, all authenticated users have all permissions
    return true;
}

/**
 * Rate limiting helper (simplified)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
    userId: string,
    maxRequests: number = 100,
    windowMs: number = 60000
): boolean {
    const now = Date.now();
    const userLimit = rateLimitStore.get(userId);

    if (!userLimit || userLimit.resetAt < now) {
        // Reset or initialize
        rateLimitStore.set(userId, {
            count: 1,
            resetAt: now + windowMs,
        });
        return true;
    }

    if (userLimit.count >= maxRequests) {
        return false; // Rate limit exceeded
    }

    userLimit.count++;
    return true;
}

/**
 * Wrapper with rate limiting
 */
export async function withAuthAndRateLimit(
    handler: (userId: string) => Promise<NextResponse>,
    maxRequests: number = 100,
    windowMs: number = 60000
): Promise<NextResponse> {
    return withAuth(async (userId) => {
        // Check rate limit
        if (!checkRateLimit(userId, maxRequests, windowMs)) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            );
        }

        return handler(userId);
    });
}

/**
 * Validate request body against expected fields
 */
export function validateRequestBody<T>(
    body: any,
    requiredFields: (keyof T)[]
): { isValid: boolean; missing?: string[] } {
    const missing: string[] = [];

    for (const field of requiredFields) {
        if (
            !(field in body) ||
            body[field] === undefined ||
            body[field] === null
        ) {
            missing.push(field as string);
        }
    }

    if (missing.length > 0) {
        return { isValid: false, missing };
    }

    return { isValid: true };
}

/**
 * Sanitize user input (basic implementation)
 */
export function sanitizeInput(input: string): string {
    // Remove potential XSS vectors
    return input
        .replace(/[<>]/g, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+=/gi, "")
        .trim();
}

/**
 * Log API activity (for monitoring/debugging)
 */
export function logApiActivity(
    userId: string,
    action: string,
    details?: any
): void {
    const timestamp = new Date().toISOString();
    // console.log(
    //     JSON.stringify({
    //         timestamp,
    //         userId,
    //         action,
    //         details,
    //     })
    // );
}

