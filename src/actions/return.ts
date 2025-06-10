'use server';

import { cookies } from 'next/headers';
import { Query, Databases, Account, ID } from 'node-appwrite';
import { createSessionClient } from '@/lib/appwrite/config';
import {
    BorrowItem,
    BorrowReceipt,
    BorrowUpdate,
    InventoryDocument,
    InventoryUpdate,
    ReturnBorrowRequest,
    ServiceResponse,
    ItemReturnCondition,
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

/**
 * Retrieves borrow receipts based on optional status filter
 * @param {string} [status] - Optional status filter ('active' | 'returned')
 * @returns {Promise<ServiceResponse<BorrowReceipt[]>>} Array of borrow receipts
 */
export async function getReceipts(status?: 'active' | 'returned'): Promise<ServiceResponse<BorrowReceipt[]>> {
    const client = await getSessionDatabases();
    if (!client) return handleUnauthorized();

    const { databases, account } = client;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const receiptsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_BORROW_RECEIPTS_COLLECTION_ID!;

    try {
        const requestUser = await account.get();
        const queries = [Query.equal('userId', requestUser.$id)];

        // Add status filter if provided
        if (status) {
            queries.push(Query.equal('status', status));
        }

        const receipts = await databases.listDocuments<BorrowReceipt>(databaseId, receiptsCollectionId, queries);

        return {
            success: true,
            message: 'Receipts retrieved successfully',
            data: receipts.documents,
        };
    } catch (error) {
        return handleError(error);
    }
}

/**
 * Retrieves a specific borrow receipt by ID
 * @param {string} id - Receipt ID to retrieve
 * @returns {Promise<ServiceResponse<BorrowReceipt>>} Single borrow receipt
 */
export async function getReceipt(id: string): Promise<ServiceResponse<BorrowReceipt>> {
    const client = await getSessionDatabases();
    if (!client) return handleUnauthorized();

    const { databases, account } = client;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const receiptsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_BORROW_RECEIPTS_COLLECTION_ID!;

    try {
        const requestUser = await account.get();
        const receipt = await databases.getDocument<BorrowReceipt>(databaseId, receiptsCollectionId, id);

        // Verify the receipt belongs to the requesting user
        if (receipt.userId !== requestUser.$id) {
            return {
                success: false,
                message: 'Unauthorized to access this receipt',
            };
        }

        return {
            success: true,
            message: 'Receipt retrieved successfully',
            data: receipt,
        };
    } catch (error) {
        return handleError(error);
    }
}

/**
 * Returns borrowed items and updates inventory.
 * @param {ReturnBorrowRequest[]} request - Array of items to return with their quantities.
 * @param {string} receiptId - The receipt ID associated with the borrowed items.
 * @returns {Promise<ServiceResponse<BorrowUpdate[]>>} - Array of updated borrow records.
 */
export async function returnItems(
    request: ReturnBorrowRequest[],
    receiptId: string
): Promise<ServiceResponse<BorrowUpdate[]>> {
    const client = await getSessionDatabases();
    if (!client) {
        return handleUnauthorized();
    }

    const { databases, account } = client;
    const updatedBorrows: BorrowUpdate[] = [];
    const updatedInventories: InventoryUpdate[] = [];
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const borrowItemsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_BORROW_ITEMS_COLLECTION_ID!;
    const inventoryCollectionId = process.env.NEXT_PUBLIC_APPWRITE_INVENTORY_COLLECTION_ID!;
    const receiptsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_BORROW_RECEIPTS_COLLECTION_ID!;
    const returnConditionsCollectionId = 'item_return_conditions';

    try {
        // Get current user first
        const requestUser = await account.get();

        const currentDate = new Date().toISOString();

        // Get receipt first to update returned quantities
        const receipt = await databases.getDocument<BorrowReceipt>(databaseId, receiptsCollectionId, receiptId);

        // Verify the receipt belongs to the requesting user
        if (receipt.userId !== requestUser.$id) {
            return {
                success: false,
                message: 'Unauthorized to return items from this receipt',
            };
        }

        // Initialize returned_quantities if it doesn't exist
        const returnedQuantities = receipt.returned_quantities || receipt.item_ids.map(() => 0);

        for (const item of request) {
            // Find the borrow item
            const borrowItemsList = await databases.listDocuments<BorrowItem>(databaseId, borrowItemsCollectionId, [
                Query.equal('receiptId', receiptId),
                Query.equal('itemId', item.itemId),
            ]);

            const [borrowItem] = borrowItemsList.documents;
            if (!borrowItem) {
                throw new Error(`Borrow item with receiptId ${receiptId} and itemId ${item.itemId} not found`);
            }

            // Calculate new quantities
            const newReturnedQuantity = (borrowItem.returned_quantity || 0) + item.quantity;
            const remainingQuantity = borrowItem.quantity - newReturnedQuantity;

            if (remainingQuantity < 0) {
                throw new Error(`Return quantity exceeds borrowed quantity for itemId ${item.itemId}`);
            }

            // Prepare updates for borrow item
            const borrowItemUpdates: Partial<BorrowItem> = {
                returned_quantity: newReturnedQuantity,
            };

            if (remainingQuantity === 0) {
                // All quantities returned for this item
                borrowItemUpdates.status = 'returned';
                borrowItemUpdates.returnedAt = currentDate;
            }

            // Update borrow item
            await databases.updateDocument<BorrowItem>(
                databaseId,
                borrowItemsCollectionId,
                borrowItem.$id,
                borrowItemUpdates
            );

            // Create item return condition record
            await databases.createDocument<ItemReturnCondition>(
                databaseId,
                returnConditionsCollectionId,
                ID.unique(),
                {
                    receiptId: receiptId,
                    itemId: item.itemId,
                    userId: requestUser.$id,
                    condition: item.condition,
                    quantity: item.quantity,
                    notes: item.notes || null,
                }
            );

            // Update receipt's returned quantities
            const itemIndex = receipt.item_ids.findIndex((id) => id === item.itemId);
            if (itemIndex !== -1) {
                returnedQuantities[itemIndex] += item.quantity;
            }

            // Update inventory quantities
            const inventoryList = await databases.listDocuments<InventoryDocument>(databaseId, inventoryCollectionId, [
                Query.equal('itemId', item.itemId),
            ]);

            const [inventory] = inventoryList.documents;
            if (!inventory) {
                throw new Error(`Inventory item with itemId ${item.itemId} not found`);
            }

            const newTotalBorrowed = inventory.total_borrowed - item.quantity;
            const newAvailableQuantity = inventory.available_quantity + item.quantity;

            if (newTotalBorrowed < 0 || newAvailableQuantity > inventory.total_quantity) {
                throw new Error('Inventory quantities would become invalid');
            }

            await databases.updateDocument<InventoryDocument>(databaseId, inventoryCollectionId, inventory.$id, {
                total_borrowed: newTotalBorrowed,
                available_quantity: newAvailableQuantity,
            });

            // Store updates for potential rollback
            updatedBorrows.push({
                borrowId: borrowItem.$id,
                previousData: {
                    status: borrowItem.status as 'active' | 'returned',
                    returnedAt: borrowItem.returnedAt ?? null,
                    quantity: borrowItem.quantity,
                    returned_quantity: borrowItem.returned_quantity || 0,
                },
            });

            updatedInventories.push({
                inventoryId: inventory.$id,
                previousData: {
                    total_borrowed: inventory.total_borrowed,
                    available_quantity: inventory.available_quantity,
                },
            });
        }

        // Check if all items are fully returned
        const allReceiptItems = await databases.listDocuments<BorrowItem>(databaseId, borrowItemsCollectionId, [
            Query.equal('receiptId', receiptId),
        ]);

        const allItemsReturned = allReceiptItems.documents.every(
            (item) => item.quantity === (item.returned_quantity || 0)
        );

        // Update receipt with new returned quantities and status if needed
        const receiptUpdates: Partial<BorrowReceipt> = {
            returned_quantities: returnedQuantities,
        };

        if (allItemsReturned) {
            receiptUpdates.status = 'returned';
            receiptUpdates.returnDate = currentDate;
        }

        await databases.updateDocument<BorrowReceipt>(databaseId, receiptsCollectionId, receiptId, receiptUpdates);

        return {
            success: true,
            message: 'Items returned successfully',
            data: updatedBorrows,
        };
    } catch (error) {
        console.error('Error returning items:', error);

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

/**
 * Retrieves item return conditions for a specific receipt
 * @param {string} receiptId - Receipt ID to get conditions for
 * @returns {Promise<ServiceResponse<ItemReturnCondition[]>>} Array of return conditions
 */
export async function getReturnConditions(receiptId: string): Promise<ServiceResponse<ItemReturnCondition[]>> {
    const client = await getSessionDatabases();
    if (!client) return handleUnauthorized();

    const { databases, account } = client;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const returnConditionsCollectionId = 'item_return_conditions';

    try {
        const requestUser = await account.get();
        const conditions = await databases.listDocuments<ItemReturnCondition>(
            databaseId,
            returnConditionsCollectionId,
            [
                Query.equal('receiptId', receiptId),
                Query.equal('userId', requestUser.$id),
            ]
        );

        return {
            success: true,
            message: 'Return conditions retrieved successfully',
            data: conditions.documents,
        };
    } catch (error) {
        return handleError(error);
    }
}
