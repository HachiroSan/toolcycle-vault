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
    category?: string;
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
    const category = params?.category || '';
    const sortBy = params?.sortBy || 'name';
    const sortDirection = params?.sortDirection || 'asc';
    const status = params?.status || 'active';

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

        if (search) {
            queries.push(Query.search('name', search));
        }

        if (type) {
            queries.push(Query.equal('type', type));
        }

        if (category) {
            queries.push(Query.equal('category', category));
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

        // First get the items
        const items = await databases.listDocuments<BaseItem>(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_ITEMS_COLLECTION_ID!,
            queries
        );

        // Then get inventories for these items in a single query
        const itemIds = items.documents.map(item => item.$id);
        console.log('Fetching inventories for items:', itemIds);

        const inventoryQueries = [Query.equal('is_deleted', false)];
        if (itemIds.length > 0) {
            inventoryQueries.push(Query.equal('itemId', itemIds));
        }

        const inventoryList = await databases.listDocuments<InventoryDocument>(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_INVENTORY_COLLECTION_ID!,
            inventoryQueries
        );

        console.log('Found inventories:', inventoryList.documents.length);

        // Create a map for quick inventory lookup
        const inventoryMap = new Map(
            inventoryList.documents.map(inv => [inv.itemId, inv])
        );

        // Map items to include their inventory
        const itemsWithInventory = items.documents.map((item) => {
            const inventory = inventoryMap.get(item.$id);
            console.log(`Mapping inventory for item ${item.$id}:`, inventory ? 'found' : 'not found');

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
        console.error('Error in getItemsWithInventory:', error);
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
        console.error('createItem: No session cookie found');
        return { success: false, message: 'No session cookie found' };
    }

    try {
        console.log('createItem: Request received:', request);
        const { databases } = await createSessionClient(sessionCookie.value);
        const itemId = ID.unique();

        const itemData = {
            name: request.name,
            type: request.type,
            category: request.category,
            length: request.length !== undefined ? Number(request.length) : null,
            diameter: request.diameter !== undefined ? Number(request.diameter) : null,
            flute: request.flute !== undefined ? Number(request.flute) : null,
            coating: request.coating,
            material: request.material,
            description: request.description,
            is_deleted: false
        };
        console.log('createItem: Creating item with data:', itemData);

        const item = await databases.createDocument<BaseItem>(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_ITEMS_COLLECTION_ID!,
            itemId,
            itemData
        );
        console.log('createItem: Item created:', item);

        const inventoryId = ID.unique();
        const inventoryData = {
            itemId: item.$id,
            total_quantity: request.total_quantity,
            total_borrowed: request.total_borrowed || 0,
            available_quantity: request.total_quantity - (request.total_borrowed || 0),
            is_deleted: false
        };
        console.log('createItem: Creating inventory with data:', inventoryData);

        const inventory = await databases.createDocument<InventoryDocument>(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_INVENTORY_COLLECTION_ID!,
            inventoryId,
            inventoryData
        );
        console.log('createItem: Inventory created:', inventory);

        const itemWithInventory: ItemWithInventory = {
            ...item,
            inventory: {
                total_quantity: inventory.total_quantity,
                total_borrowed: inventory.total_borrowed,
                available_quantity: inventory.available_quantity,
            },
        };
        console.log('createItem: Returning itemWithInventory:', itemWithInventory);

        return {
            success: true,
            message: 'Item created successfully',
            data: itemWithInventory,
        };
    } catch (error) {
        console.error('createItem: Error occurred:', error);
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
                category: request.category ?? item.category,
                length: request.length !== undefined ? Number(request.length) : item.length,
                diameter: request.diameter !== undefined ? Number(request.diameter) : item.diameter,
                flute: request.flute !== undefined ? Number(request.flute) : item.flute,
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

// Migration function to add categories to existing items
export async function migrateItemCategories(): Promise<Response<{ updated: number; total: number }>> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
        return { success: false, message: 'No session cookie found' };
    }

    try {
        const { databases } = await createSessionClient(sessionCookie.value);
        
        // Get all items without categories
        const allItems = await databases.listDocuments<BaseItem>(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_ITEMS_COLLECTION_ID!,
            [
                Query.equal('is_deleted', false),
                Query.limit(1000) // Process in batches if needed
            ]
        );

        let updatedCount = 0;
        const totalItems = allItems.documents.length;

        for (const item of allItems.documents) {
            // Only update items that don't have a category yet
            if (!item.category) {
                let defaultCategory = null;
                
                // Set default category based on type
                if (item.type === 'turning') {
                    defaultCategory = 'General Turning'; // Default to first category
                } else if (item.type === 'milling') {
                    defaultCategory = 'Flat end mill'; // Default to first category
                }
                // For 'other' types, leave category as null
                
                if (defaultCategory) {
                    await databases.updateDocument(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                        process.env.NEXT_PUBLIC_APPWRITE_ITEMS_COLLECTION_ID!,
                        item.$id,
                        {
                            category: defaultCategory,
                        }
                    );
                    updatedCount++;
                }
            }
        }

        return {
            success: true,
            message: `Migration completed: ${updatedCount} items updated out of ${totalItems} total items`,
            data: { updated: updatedCount, total: totalItems },
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to migrate item categories',
        };
    }
}
