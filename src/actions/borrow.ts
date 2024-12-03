'use server';

import { cookies } from 'next/headers';
import { ID, Query, Databases, Account } from 'node-appwrite';
import { createSessionClient } from '@/lib/appwrite/config';
import {
    CreateBorrowRequest,
    ReturnBorrowRequest,
    ServiceResponse,
    InventoryUpdate,
    BorrowUpdate,
    InventoryDocument,
    BorrowReceipt,
    BorrowItem,
} from '@/data/borrow.type';

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

        // Create receipt first
        createdReceipt = await databases.createDocument<BorrowReceipt>(databaseId, receiptsCollectionId, receiptId, {
            userId: requestUser.$id,
            item_ids: request.item_ids,
            item_quantities: request.item_quantities,
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

            // Create borrow item record
            const borrowItem = await databases.createDocument<BorrowItem>(
                databaseId,
                borrowItemsCollectionId,
                ID.unique(),
                {
                    receiptId: receiptId,
                    userId: requestUser.$id,
                    itemId: itemId,
                    quantity: quantity,
                    status: 'active',
                }
            );
            createdBorrowItems.push(borrowItem);

            // Update inventory
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
        // Rollback everything if something fails
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

// Return borrowed items
export async function returnItems(request: ReturnBorrowRequest[]): Promise<ServiceResponse<BorrowUpdate[]>> {
    const client = await getSessionDatabases();
    if (!client) return handleUnauthorized();

    const { databases } = client;
    const updatedBorrows: BorrowUpdate[] = [];
    const updatedInventories: InventoryUpdate[] = [];
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const borrowItemsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_BORROW_ITEMS_COLLECTION_ID!;
    const inventoryCollectionId = process.env.NEXT_PUBLIC_APPWRITE_INVENTORY_COLLECTION_ID!;
    const receiptsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_BORROW_RECEIPTS_COLLECTION_ID!;

    try {
        for (const item of request) {
            const currentDate = new Date().toISOString();

            // Update borrow item status and return date
            const previousBorrow = await databases.getDocument<BorrowItem>(
                databaseId,
                borrowItemsCollectionId,
                item.borrowId
            );

            await databases.updateDocument<BorrowItem>(databaseId, borrowItemsCollectionId, item.borrowId, {
                status: 'returned',
                returnedAt: currentDate, // Add return date for individual item
            });

            // Update inventory quantities
            const inventoryList = await databases.listDocuments<InventoryDocument>(databaseId, inventoryCollectionId, [
                Query.equal('itemId', previousBorrow.itemId),
            ]);

            const [inventory] = inventoryList.documents;
            if (!inventory) {
                throw new Error(`Inventory item with itemId ${previousBorrow.itemId} not found`);
            }

            const newTotalBorrowed = inventory.total_borrowed - item.quantity;
            const newAvailableQuantity = inventory.available_quantity + item.quantity;

            await databases.updateDocument<InventoryDocument>(databaseId, inventoryCollectionId, inventory.$id, {
                total_borrowed: newTotalBorrowed,
                available_quantity: newAvailableQuantity,
            });

            // Store updates for potential rollback
            updatedBorrows.push({
                borrowId: item.borrowId,
                previousData: {
                    status: previousBorrow.status as 'active' | 'returned',
                    returnedAt: previousBorrow.returnedAt ?? null,
                },
            });

            updatedInventories.push({
                inventoryId: inventory.$id,
                previousData: {
                    total_borrowed: inventory.total_borrowed,
                    available_quantity: inventory.available_quantity,
                },
            });

            // Check if all items in the receipt are returned
            const receiptItems = await databases.listDocuments<BorrowItem>(databaseId, borrowItemsCollectionId, [
                Query.equal('receiptId', previousBorrow.receiptId),
            ]);

            const allItemsReturned = receiptItems.documents.every((item) => item.status === 'returned');

            if (allItemsReturned) {
                // Update receipt status and return date
                await databases.updateDocument<BorrowReceipt>(
                    databaseId,
                    receiptsCollectionId,
                    previousBorrow.receiptId,
                    {
                        status: 'returned',
                        returnDate: currentDate,
                    }
                );
            }
        }

        return {
            success: true,
            message: 'Items returned successfully',
            data: updatedBorrows,
        };
    } catch (error) {
        // Rollback all changes if anything fails
        await Promise.all([
            ...updatedBorrows.map((update) =>
                databases.updateDocument<BorrowItem>(
                    databaseId,
                    borrowItemsCollectionId,
                    update.borrowId,
                    update.previousData
                )
            ),
            ...updatedInventories.map((update) =>
                databases.updateDocument<InventoryDocument>(
                    databaseId,
                    inventoryCollectionId,
                    update.inventoryId,
                    update.previousData
                )
            ),
        ]);

        return handleError(error);
    }
}
