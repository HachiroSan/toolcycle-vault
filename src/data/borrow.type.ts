import { Models } from 'node-appwrite';

export interface CreateBorrowRequest {
    item_ids: string[];
    item_quantities: number[];
    dueDate: string;
    lecturer?: string;
    subject?: string;
    notes?: string;
}
export interface ReturnBorrowRequest {
    itemId: string;
    quantity: number;
}

export interface ServiceResponse<T = void> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface InventoryUpdate {
    inventoryId: string;
    previousData: {
        total_borrowed: number;
        available_quantity: number;
    };
}

export interface BorrowUpdate {
    borrowId: string;
    previousData: {
        status: 'active' | 'returned';
        returnedAt: string | null;
        quantity: number;
        returned_quantity: number;
    };
}

export interface InventoryDocument extends Models.Document {
    itemId: string;
    total_borrowed: number;
    available_quantity: number;
}

export interface BorrowDocument extends Models.Document {
    userId: string;
    itemId: string;
    quantity: number;
    dueDate: string;
    status: 'active' | 'returned';
    returnedAt: string | null;
    lecturer?: string | null;
    subject?: string | null;
    notes?: string | null;
}

export interface BorrowReceipt extends Models.Document {
    userId: string;
    item_ids: string[];
    item_quantities: number[];
    dueDate: string;
    returnDate: string | null;
    notes: string | null;
    lecturer: string | null;
    subject: string | null;
    status: string;
}

export interface BorrowItem extends Models.Document {
    receiptId: string;
    userId: string;
    itemId: string;
    quantity: number;
    status: string;
    returnedAt: string | null;
}

export interface CreateBorrowRequest {
    item_ids: string[];
    item_quantities: number[];
    dueDate: string;
    lecturer?: string;
    subject?: string;
    notes?: string;
}
