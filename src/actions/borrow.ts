'use server';

import { cookies } from 'next/headers';
import { ID, Query, Databases, Account } from 'node-appwrite';
import { createSessionClient } from '@/lib/appwrite/config';
import { CreateBorrowRequest, ServiceResponse, InventoryUpdate, BorrowReceipt, BorrowItem } from '@/data/borrow.type';

// Helper function to handle unauthorized cases
function handleUnauthorized<T>(): ServiceResponse<T> {
    return { success: false, message: 'Unauthorized', data: undefined };
}

// Helper function to handle errors
function handleError<T>(error: unknown): ServiceResponse<T> {
    const message = error instanceof Error ? error.message : 'Operation failed';
    return { success: false, message };
}

async function getSessionDatabases(): Promise<{ databases: Databases; account: Account } | null> {
    const sessionCookie = await cookies();
    const cookieStore = sessionCookie.get('session');
    if (!cookieStore) return null;
    return createSessionClient(cookieStore.value);
}

async function generateReceiptId(databases: Databases, userId: string): Promise<string> {
    // Get today's date in YYMMDD format
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');

    // Get user's last 4 characters
    const userSuffix = userId.slice(-4);

    // Query receipts for this user from today
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const receiptsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_BORROW_RECEIPTS_COLLECTION_ID!;

    const receipts = await databases.listDocuments(databaseId, receiptsCollectionId, [
        Query.equal('userId', userId),
        Query.startsWith('$id', `REF-${dateStr}`),
    ]);

    // Get next increment number
    const increment = (receipts.documents.length + 1).toString().padStart(3, '0');

    return `ref-${dateStr}-${userSuffix}-${increment}`.toLowerCase();
}

// Borrow items
export async function borrowItems(request: CreateBorrowRequest): Promise<ServiceResponse<BorrowReceipt>> {
    const client = await getSessionDatabases();
    if (!client) return handleUnauthorized();

    const requestUser = await client.account.get();
    const { databases } = client;

    const updatedInventories: InventoryUpdate[] = [];
    let createdReceipt: BorrowReceipt | null = null;
    const createdBorrowItems: BorrowItem[] = [];

    try {
        const receiptId = await generateReceiptId(client.databases, requestUser.$id);
        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const receiptsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_BORROW_RECEIPTS_COLLECTION_ID!;
        const borrowItemsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_BORROW_ITEMS_COLLECTION_ID!;
        const inventoryCollectionId = process.env.NEXT_PUBLIC_APPWRITE_INVENTORY_COLLECTION_ID!;

        // Create receipt with returned_quantities initialized to 0s
        createdReceipt = await databases.createDocument<BorrowReceipt>(databaseId, receiptsCollectionId, receiptId, {
            userId: requestUser.$id,
            item_ids: request.item_ids,
            item_quantities: request.item_quantities,
            returned_quantities: request.item_ids.map(() => 0), // Initialize returned quantities
            dueDate: request.dueDate,
            returnDate: null,
            notes: request.notes ?? null,
            lecturer: request.lecturer ?? null,
            subject: request.subject ?? null,
            status: 'active',
        });

        // Create borrow items
        for (let i = 0; i < request.item_ids.length; i++) {
            const itemId = request.item_ids[i];
            const quantity = request.item_quantities[i];

            // Create borrow item with returned_quantity initialized to 0
            const borrowItem = await databases.createDocument<BorrowItem>(
                databaseId,
                borrowItemsCollectionId,
                ID.unique(),
                {
                    receiptId: receiptId,
                    userId: requestUser.$id,
                    itemId: itemId,
                    quantity: quantity,
                    returned_quantity: 0, // Initialize returned quantity
                    status: 'active',
                }
            );
            createdBorrowItems.push(borrowItem);

            // Rest of inventory update logic remains the same
            const inventoryList = await databases.listDocuments(databaseId, inventoryCollectionId, [
                Query.equal('itemId', itemId),
            ]);

            const [inventory] = inventoryList.documents;
            if (!inventory) {
                throw new Error(`Inventory item with itemId ${itemId} not found`);
            }

            const newTotalBorrowed = inventory.total_borrowed + quantity;
            const newAvailableQuantity = inventory.available_quantity - quantity;

            if (newAvailableQuantity < 0) {
                throw new Error(`Not enough quantity available for item ${itemId}`);
            }

            await databases.updateDocument(databaseId, inventoryCollectionId, inventory.$id, {
                total_borrowed: newTotalBorrowed,
                available_quantity: newAvailableQuantity,
            });

            updatedInventories.push({
                inventoryId: inventory.$id,
                previousData: {
                    total_borrowed: inventory.total_borrowed,
                    available_quantity: inventory.available_quantity,
                },
            });
        }

        return {
            success: true,
            message: 'Items borrowed successfully',
            data: createdReceipt,
        };
    } catch (error) {
        // Rollback logic remains the same since new fields don't need special handling
        if (createdReceipt) {
            await databases.deleteDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_BORROW_RECEIPTS_COLLECTION_ID!,
                createdReceipt.$id
            );
        }

        await Promise.all([
            ...createdBorrowItems.map((item) =>
                databases.deleteDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_BORROW_ITEMS_COLLECTION_ID!,
                    item.$id
                )
            ),
            ...updatedInventories.map((update) =>
                databases.updateDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_INVENTORY_COLLECTION_ID!,
                    update.inventoryId,
                    update.previousData
                )
            ),
        ]);

        return handleError(error);
    }
}
