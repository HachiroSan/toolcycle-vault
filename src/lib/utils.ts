import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatDateTime = (date: string | Date | undefined): string => {
    if (!date) return 'N/A';
    const utcDate = new Date(date);

    return utcDate.toLocaleString('en-UK', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kuala_Lumpur', // Use Malaysia time zone
    });
};

export interface GenerateReferenceIdParams {
    counter?: number;
}

export const generateReferenceId = (counter: number = 1): string => {
    /**
     * Generates a shorter, human-friendly reference ID.
     *
     * @param {string} prefix - Prefix for the reference ID (e.g., INV, ORD).
     * @param {number} counter - A sequential counter to ensure uniqueness.
     * @returns {string} - Generated reference ID in the format PREFIX-YYMMDD-COUNTER.
     */
    const today = new Date();
    const yy = today.getFullYear().toString().slice(-2); // Get last two digits of the year
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Month (01-12)
    const dd = String(today.getDate()).padStart(2, '0'); // Day (01-31)
    const datePart = `${yy}${mm}${dd}`;

    const counterPart = counter.toString().padStart(3, '0'); // Pad the counter with leading zeros

    return `REF-${datePart}-${counterPart}`; // Example: REF-241203-001
};
