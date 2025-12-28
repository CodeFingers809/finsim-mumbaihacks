import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDatabase } from "@/lib/db/mongodb";

export interface UserFilters {
    scrips: string[];
    categories: string[];
    keywords: string[];
}

export interface UserDocument {
    _id: string;
    clerkId: string;
    phoneNumber?: string | null;
    filters: UserFilters;
    createdAt: string;
    updatedAt: string;
}

const DEFAULT_FILTERS: UserFilters = {
    scrips: [],
    categories: [],
    keywords: [],
};

function cleanList(
    values?: string[],
    transform?: (value: string) => string
): string[] {
    if (!Array.isArray(values)) return [];

    const mapper = transform ?? ((value: string) => value);
    const unique = new Set(
        values
            .map((value) => mapper(value).trim())
            .filter((value) => value.length > 0)
    );

    return Array.from(unique);
}

function normalizeFilters(filters?: Partial<UserFilters>): UserFilters {
    return {
        scrips: cleanList(filters?.scrips, (value) => value.toUpperCase()),
        categories: cleanList(filters?.categories),
        keywords: cleanList(filters?.keywords),
    };
}

function formatUser(doc: any): UserDocument {
    return {
        _id: doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id),
        clerkId: doc.clerkId,
        phoneNumber: doc.phoneNumber ?? null,
        filters: {
            ...DEFAULT_FILTERS,
            ...(doc.filters || {}),
        },
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}

export async function getUserProfile(clerkId: string): Promise<NextResponse> {
    try {
        const db = await getDatabase();
        const collection = db.collection("users");
        const existing = await collection.findOne({ clerkId });

        if (!existing) {
            const now = new Date().toISOString();
            const baseDoc = {
                clerkId,
                phoneNumber: null,
                filters: DEFAULT_FILTERS,
                createdAt: now,
                updatedAt: now,
            };

            const result = await collection.insertOne(baseDoc);
            return NextResponse.json(
                { user: formatUser({ ...baseDoc, _id: result.insertedId }) },
                { status: 201 }
            );
        }

        return NextResponse.json({ user: formatUser(existing) });
    } catch (error) {
        console.error("Error fetching user profile", error);
        return NextResponse.json(
            { error: "Failed to load user profile" },
            { status: 500 }
        );
    }
}

interface UpdatePayload {
    phoneNumber?: string | null;
    filters?: Partial<UserFilters>;
}

export async function upsertUserFilters(
    clerkId: string,
    payload: UpdatePayload
): Promise<NextResponse> {
    try {
        const db = await getDatabase();
        const collection = db.collection("users");

        const now = new Date().toISOString();
        const normalizedFilters = normalizeFilters(payload.filters);
        const phoneNumber = payload.phoneNumber?.trim() || null;

        const result = await collection.findOneAndUpdate(
            { clerkId },
            {
                $set: {
                    phoneNumber,
                    filters: normalizedFilters,
                    updatedAt: now,
                },
                $setOnInsert: {
                    clerkId,
                    createdAt: now,
                },
            },
            { upsert: true, returnDocument: "after" }
        );

        if (!result.value) {
            const fallbackDoc = {
                _id: new ObjectId(),
                clerkId,
                phoneNumber,
                filters: normalizedFilters,
                createdAt: now,
                updatedAt: now,
            };
            return NextResponse.json({ user: formatUser(fallbackDoc) });
        }

        return NextResponse.json({ user: formatUser(result.value) });
    } catch (error) {
        console.error("Error saving user filters", error);
        return NextResponse.json(
            { error: "Failed to save user filters" },
            { status: 500 }
        );
    }
}

