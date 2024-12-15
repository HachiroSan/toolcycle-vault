'use server';

import { cookies } from 'next/headers';
import { ID, Query } from 'node-appwrite';
import { createSessionClient } from '@/lib/appwrite/config';
import { type Response } from '@/data/response.type';
import {
    BaseItem,
    CreateItemRequest,
    EditItemWithInventoryRequest,
    InventoryDocument,
    ItemWithInventory,
} from '@/data/inventory.type';

export async function getItemWithInventory(itemId: string): Promise<Response<ItemWithInventory>> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
        return { success: false, message: 'No session cookie found' };
    }

    try {
        const { databases } = await createSessionClient(sessionCookie.value);

        const [item, inventoryList] = await Promise.all([
            databases.getDocument<BaseItem>(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_ITEMS_COLLECTION_ID!,
                itemId
            ),
            databases.listDocuments<InventoryDocument>(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_INVENTORY_COLLECTION_ID!,
                [Query.equal('itemId', itemId)]
            ),
        ]);

        const inventory = inventoryList.documents[0];
        const itemWithInventory: ItemWithInventory = {
            ...item,
            inventory: {
                total_quantity: inventory.total_quantity,
                total_borrowed: inventory.total_borrowed,
                available_quantity: inventory.available_quantity,
            },
        };

        return {
            success: true,
            message: 'Item retrieved successfully',
            data: itemWithInventory,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to retrieve item',
        };
    }
}

export async function getItems(itemIds: string[]): Promise<Response<BaseItem[]>> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
        return { success: false, message: 'No session cookie found' };
    }

    try {
        const { databases } = await createSessionClient(sessionCookie.value);

        const items = await Promise.all(
            itemIds.map((itemId) =>
                databases.getDocument<BaseItem>(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_ITEMS_COLLECTION_ID!,
                    itemId
                )
            )
        );

        return {
            success: true,
            message: 'Items retrieved successfully',
            data: items,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to retrieve items',
        };
    }
}

interface PaginatedResponse<T> extends Response<T> {
    total: number;
    hasMore: boolean;
}

// Define sort direction type
type SortDirection = 'asc' | 'desc';

interface GetItemsParams {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    sortBy?: string;
    sortDirection?: SortDirection;
    status?: 'all' | 'deleted' | 'active'; // new parameter
}

export async function getItemsWithInventory(params?: GetItemsParams): Promise<PaginatedResponse<ItemWithInventory[]>> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const search = params?.search || '';
    const type = params?.type || '';
    const sortBy = params?.sortBy || 'name';
    const sortDirection = params?.sortDirection || 'asc';
    const status = params?.status || 'active'; // default to active items

    if (!sessionCookie) {
        return {
            success: false,
            message: 'No session cookie found',
            total: 0,
            hasMore: false,
        };
    }

    try {
        const { databases } = await createSessionClient(sessionCookie.value);
        const offset = (page - 1) * limit;
        const queries = [Query.limit(limit), Query.offset(offset)];

        // Add deletion filter
        if (status === 'active') {
            queries.push(Query.equal('is_deleted', false));
        } else if (status === 'deleted') {
            queries.push(Query.equal('is_deleted', true));
        }
        // 'all' case doesn't need a filter

        if (search) {
            queries.push(Query.search('name', search));
        }

        if (type) {
            queries.push(Query.equal('type', type));
        }

        // Handle dynamic sorting
        const applySort = (field: string) => {
            queries.push(sortDirection === 'asc' ? Query.orderAsc(field) : Query.orderDesc(field));
        };

        // Special cases for sorting
        switch (sortBy) {
            case 'quantity':
                applySort('inventory.total_quantity');
                break;
            case 'date':
                applySort('$createdAt');
                break;
            default:
                applySort(sortBy);
        }

        const [items, inventoryList] = await Promise.all([
            databases.listDocuments<BaseItem>(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_ITEMS_COLLECTION_ID!,
                queries
            ),
            databases.listDocuments<InventoryDocument>(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_INVENTORY_COLLECTION_ID!
            ),
        ]);

        const itemsWithInventory = items.documents.map((item) => {
            const inventory = inventoryList.documents.find((inv) => inv.itemId === item.$id);

            return {
                ...item,
                inventory: inventory
                    ? {
                          total_quantity: inventory.total_quantity,
                          total_borrowed: inventory.total_borrowed,
                          available_quantity: inventory.available_quantity,
                      }
                    : {
                          total_quantity: 0,
                          total_borrowed: 0,
                          available_quantity: 0,
                      },
            };
        });

        return {
            success: true,
            message: 'Items retrieved successfully',
            data: itemsWithInventory,
            total: items.total,
            hasMore: offset + items.documents.length < items.total,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to retrieve items',
            total: 0,
            hasMore: false,
        };
    }
}

export async function createItem(request: CreateItemRequest): Promise<Response<ItemWithInventory>> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
        return { success: false, message: 'No session cookie found' };
    }

    try {
        const { databases } = await createSessionClient(sessionCookie.value);
        const itemId = ID.unique();

        const item = await databases.createDocument<BaseItem>(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_ITEMS_COLLECTION_ID!,
            itemId,
            {
                name: request.name,
                type: request.type,
                size: request.size,
                length: request.length !== undefined || 0 ? Number(request.length) : null,
                brand: request.brand,
                coating: request.coating,
                material: request.material,
                description: request.description,
            }
        );

        const inventoryId = ID.unique();
        const inventory = await databases.createDocument<InventoryDocument>(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_INVENTORY_COLLECTION_ID!,
            inventoryId,
            {
                itemId: item.$id,
                total_quantity: request.total_quantity,
                total_borrowed: request.total_borrowed || 0,
                available_quantity: request.total_quantity - (request.total_borrowed || 0),
            }
        );

        const itemWithInventory: ItemWithInventory = {
            ...item,
            inventory: {
                total_quantity: inventory.total_quantity,
                total_borrowed: inventory.total_borrowed,
                available_quantity: inventory.available_quantity,
            },
        };

        return {
            success: true,
            message: 'Item created successfully',
            data: itemWithInventory,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to create item',
        };
    }
}

export async function editItemWithInventory(request: EditItemWithInventoryRequest) {
    try {
        const { databases } = await createSessionClient();

        // Validate existence and get current state
        const [item, inventoryList] = await Promise.all([
            databases.getDocument<BaseItem>(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_ITEMS_COLLECTION_ID!,
                request.id
            ),
            databases.listDocuments<InventoryDocument>(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_INVENTORY_COLLECTION_ID!,
                [Query.equal('itemId', request.id)]
            ),
        ]);

        const inventory = inventoryList.documents[0];

        // Validate inventory numbers
        if (request.total_quantity !== undefined && request.total_quantity < 0) {
            throw new Error('Total quantity cannot be negative');
        }

        if (request.total_borrowed !== undefined && request.total_borrowed < 0) {
            throw new Error('Total borrowed cannot be negative');
        }

        const newTotalQuantity = request.total_quantity ?? inventory.total_quantity;
        const newTotalBorrowed = request.total_borrowed ?? inventory.total_borrowed;

        if (newTotalBorrowed > newTotalQuantity) {
            throw new Error('Total borrowed cannot exceed total quantity');
        }

        // Update base item
        const updatedItem = await databases.updateDocument<BaseItem>(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_ITEMS_COLLECTION_ID!,
            request.id,
            {
                name: request.name ?? item.name,
                type: request.type ?? item.type,
                size: request.size ?? item.size,
                length: request.length !== undefined ? Number(request.length) : item.length,
                brand: request.brand ?? item.brand,
                coating: request.coating ?? item.coating,
                material: request.material ?? item.material,
                description: request.description ?? item.description,
            }
        );

        // Update inventory
        const updatedInventory = await databases.updateDocument<InventoryDocument>(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_INVENTORY_COLLECTION_ID!,
            inventory.$id,
            {
                total_quantity: newTotalQuantity,
                total_borrowed: newTotalBorrowed,
                available_quantity: newTotalQuantity - newTotalBorrowed,
            }
        );

        const itemWithInventory: ItemWithInventory = {
            ...updatedItem,
            inventory: {
                total_quantity: updatedInventory.total_quantity,
                total_borrowed: updatedInventory.total_borrowed,
                available_quantity: updatedInventory.available_quantity,
            },
        };

        return {
            success: true,
            message: 'Item updated successfully',
            data: itemWithInventory,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update item',
        };
    }
}

export async function deleteItemWithInventory(itemId: string): Promise<Response<void>> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
        return { success: false, message: 'No session cookie found' };
    }

    try {
        const { databases } = await createSessionClient(sessionCookie.value);

        // First get the inventory record
        const inventoryList = await databases.listDocuments<InventoryDocument>(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_INVENTORY_COLLECTION_ID!,
            [Query.equal('itemId', itemId)]
        );

        // Soft delete inventory record if exists
        if (inventoryList.documents.length > 0) {
            console.log('Soft deleting inventory record with ID:', inventoryList.documents[0].$id);
            await databases.updateDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_INVENTORY_COLLECTION_ID!,
                inventoryList.documents[0].$id,
                {
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                }
            );
        }

        // Soft delete item record
        await databases.updateDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_ITEMS_COLLECTION_ID!,
            itemId,
            {
                is_deleted: true,
                deleted_at: new Date().toISOString(),
            }
        );

        return {
            success: true,
            message: 'Item soft deleted successfully',
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to soft delete item',
        };
    }
}

export async function deleteMultipleItems(itemIds: string[]): Promise<Response<void>> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
        return { success: false, message: 'No session cookie found' };
    }

    try {
        // Soft delete all items in parallel using the modified deleteItemWithInventory
        await Promise.all(itemIds.map((id) => deleteItemWithInventory(id)));

        return {
            success: true,
            message: `Successfully soft deleted ${itemIds.length} items`,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to soft delete items',
        };
    }
}

export async function updateItemImage(itemId: string, imagePublicId: string): Promise<Response<void>> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
        return { success: false, message: 'No session cookie found' };
    }

    try {
        const { databases } = await createSessionClient(sessionCookie.value);

        await databases.updateDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_ITEMS_COLLECTION_ID!,
            itemId,
            {
                image_url: imagePublicId,
            }
        );
        return {
            success: true,
            message: 'Successfully updated item image',
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update item image',
        };
    }
}
