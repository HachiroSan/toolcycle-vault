import { z } from 'zod';
import { Response } from './response.type';

export interface PaginatedResponse<T> extends Response<T> {
    total: number;
    hasMore: boolean;
}

export interface GetItemsParams {
    page?: number;
    limit?: number;
    search?: string;
}

// Base Document interface
export interface Document {
    $id: string;
    $collectionId: string;
    $databaseId: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
}

// Base item interface extending Document
export interface BaseItem extends Document {
    name: string;
    type: string;
    size?: string | null;
    length?: number | null;
    brand?: string | null;
    coating?: string | null;
    material?: string | null;
    description?: string | null;
    image_url?: string | null;
}

// Request interface (without Document properties)
export interface CreateItemRequest {
    name: string;
    type: string;
    size?: string | null;
    length?: number | null;
    brand?: string | null;
    coating?: string | null;
    material?: string | null;
    description?: string | null;
    total_quantity: number;
    total_borrowed?: number;
}

// Inventory Document interface
export interface InventoryDocument extends Document {
    itemId: string;
    total_quantity: number;
    total_borrowed: number;
    available_quantity: number;
}

// Full item response with inventory data
export interface ItemWithInventory extends BaseItem {
    inventory: {
        total_quantity: number;
        total_borrowed: number;
        available_quantity: number;
    };
}

export interface EditItemWithInventoryRequest {
    id: string;
    // Base item properties
    name?: string;
    type?: string;
    size?: string | null;
    length?: number | null;
    brand?: string | null;
    coating?: string | null;
    material?: string | null;
    description?: string | null;
    // Inventory properties
    total_quantity?: number;
    total_borrowed?: number;
}

export const inventoryItemSchema = z.object({
    $id: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    type: z.string().min(2, 'Type must be at least 2 characters'),
    size: z.string().optional().nullable(),
    length: z.number().optional().nullable(),
    brand: z.string().optional().nullable(),
    coating: z.string().optional().nullable(),
    material: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    image_url: z.string().optional().nullable(),
    inventory: z.object({
        total_quantity: z.number().min(0, 'Total quantity must be positive'),
        total_borrowed: z.number().min(0, 'Borrowed quantity must be positive'),
        available_quantity: z.number().min(0, 'Available quantity must be positive'),
    }),
});
