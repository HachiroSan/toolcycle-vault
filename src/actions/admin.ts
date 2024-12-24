'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createAdminClient, createSessionClient } from '@/lib/appwrite/config';
import { Query, ID } from 'node-appwrite';
import { type Response } from '@/data/response.type';
import { SanitizedUser } from '@/data/user.type';

const SUPERADMIN_LABELS = ['superadmin']; // Define your superadmin labels

export type Preference = {
    $id: string;
    name: string;
    email: string;
    labels: string[];
    accessedAt: string;
    $createdAt: string;
    $updatedAt: string;
    prefs: Record<string, unknown>;
};

/**
 * Verifies if the current user has specified admin privileges
 * @param {string[]} requiredLabels - Array of required labels to check
 * @returns Promise<boolean>
 */
export async function verifyAdmin(requiredLabels: string[]): Promise<{
    isAdmin: boolean;
    id?: string;
}> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
        return { isAdmin: false };
    }

    try {
        const { account } = await createSessionClient(sessionCookie.value);
        const user = await account.get();
        return {
            isAdmin: requiredLabels.some((label) => user.labels.includes(label)),
            id: user.$id,
        };
    } catch {
        return { isAdmin: false };
    }
}

/**
 * Sanitizes a preference object by selecting only the necessary fields
 * @param {Preference} preference - The preference object to sanitize
 * @returns {Preference} The sanitized preference object
 */
const sanitizePreference = (preference: Preference): Preference => {
    return {
        $id: preference.$id,
        name: preference.name,
        email: preference.email,
        labels: preference.labels,
        accessedAt: preference.accessedAt,
        $createdAt: preference.$createdAt,
        $updatedAt: preference.$updatedAt,
        prefs: preference.prefs,
    };
};

/**
 * [Superadmin Only]: Fetches a list of admin users, optionally filtered by a specific label.
 *
 * @param {string} [label] - An optional label to filter the admin users by.
 * @returns {Promise<Response<{ total: number; users: Preference[] }>>}
 */
export async function getAdmins(label?: string): Promise<Response<{ total: number; users: Preference[] }>> {
    try {
        // Check if user has superadmin privileges
        const currentUser = await verifyAdmin(SUPERADMIN_LABELS);
        if (!currentUser.isAdmin) {
            throw new Error('Unauthorized: Requires superadmin privileges');
        }

        const { users } = await createAdminClient();

        const queries = label
            ? [Query.contains('labels', [label])]
            : [Query.contains('labels', ['admin', 'superadmin'])];

        const result = await users.list(queries);

        // Sanitize the users data
        const sanitizedUsers = {
            ...result,
            users: result.users.map(sanitizePreference),
        };
        // Revalidate the admins page to ensure fresh data
        revalidatePath('/admin/users');
        return {
            success: true,
            data: sanitizedUsers,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch admins',
        };
    }
}

/**
 * [Superadmin Only]: Updates an admin's role by modifying their labels
 * @param userId - The ID of the user to update
 * @param role - The new role ('admin' or 'superadmin')
 */
export async function updateLabel(userId: string, role: 'admin' | 'superadmin'): Promise<Response> {
    try {
        const currentUser = await verifyAdmin(SUPERADMIN_LABELS);
        if (!currentUser.isAdmin) {
            throw new Error('Unauthorized: Requires superadmin privileges');
        }

        const { users } = await createAdminClient();

        // Update user labels based on role
        await users.updateLabels(
            userId,
            [role] // Replace existing labels with new role
        );

        return {
            success: true,
            message: 'Admin role updated successfully',
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update admin role',
        };
    }
}

/**
 * [Superadmin Only]: Creates a new admin user
 * @param {string} role - Admin role type ('admin' or 'superadmin')
 * @param {Object} data - Admin user data
 * @param {string} data.name - Admin's name
 * @param {string} data.email - Admin's email
 * @param {string} data.password - Admin's password
 * @returns {Promise<Response<SanitizedUser>>} - Returns sanitized user data on success
 */
export async function createAdmin(
    role: 'admin' | 'superadmin',
    data: {
        name: string;
        email: string;
        password: string;
    }
): Promise<Response<SanitizedUser>> {
    try {
        const currentUser = await verifyAdmin(SUPERADMIN_LABELS);
        if (!currentUser.isAdmin) {
            throw new Error('Unauthorized: Requires superadmin privileges');
        }

        const { users } = await createAdminClient();
        const userId = ID.unique();

        // Create user account in Appwrite
        const user = await users.create(
            userId,
            data.email,
            undefined, // User ID is auto-generated
            data.password,
            data.name
        );

        // Set admin role
        await users.updateLabels(
            userId,
            [role] // Replace existing labels with new role
        );

        // Set initial preferences
        await users.updatePrefs(userId, {
            last_login: new Date().toISOString(),
        });

        // Sanitize user data before returning
        const sanitizedUser: SanitizedUser = {
            $id: user.$id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            passwordUpdate: user.passwordUpdate,
            registration: user.registration,
            labels: user.labels,
        };

        return {
            success: true,
            message: 'Admin created successfully',
            data: sanitizedUser,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to create admin user',
        };
    }
}

/**
 * [Superadmin Only]: Deletes an existing admin user
 * @param {string} userId - ID of admin user to delete
 * @returns {Promise<Response<void>>} - Returns success message on deletion
 */
export async function deleteAdmin(userId: string): Promise<Response<void>> {
    try {
        const currentUser = await verifyAdmin(SUPERADMIN_LABELS);
        if (!currentUser.isAdmin) {
            throw new Error('Unauthorized: Requires superadmin privileges');
        }

        // Prevent self-deletion
        if (currentUser.id === userId) {
            throw new Error('Cannot delete your own admin account');
        }

        const { users } = await createAdminClient();

        // Verify user exists and is an admin
        const user = await users.get(userId);
        if (!user.labels.includes('admin') && !user.labels.includes('superadmin')) {
            throw new Error('User is not an admin');
        }

        // Delete user account through Appwrite
        await users.delete(userId);

        return {
            success: true,
            message: 'Admin deleted successfully',
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error && error.message ? error.message : 'Failed to delete admin user',
        };
    }
}

interface EditAdminParams {
    userId: string;
    name?: string;
    email?: string;
    role?: 'admin' | 'superadmin' | 'student';
}

/**
 * [Superadmin Only]: Edits an existing admin user's details
 * @param {EditAdminParams} params - Admin user edit parameters
 * @returns {Promise<Response<void>>} - Returns success message on update
 */
export async function editAdmin(params: EditAdminParams): Promise<Response<void>> {
    try {
        const currentUser = await verifyAdmin(SUPERADMIN_LABELS);
        if (!currentUser.isAdmin) {
            throw new Error('Unauthorized: Requires superadmin privileges');
        }

        const { users } = await createAdminClient();

        // Update name if provided
        if (params.name) {
            await users.updateName(params.userId, params.name);
        }

        // Update email if provided
        if (params.email) {
            await users.updateEmail(params.userId, params.email);
        }

        // Update role if provided
        if (params.role) {
            let labels: string[];
            if (params.role === 'superadmin') {
                labels = ['superadmin'];
            } else if (params.role === 'admin') {
                labels = ['admin'];
            } else if (params.role === 'student') {
                labels = ['student'];
            } else {
                throw new Error('Invalid role specified');
            }
            await users.updateLabels(params.userId, labels);
        }

        return {
            success: true,
            message: 'Admin updated successfully',
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error && error.message ? error.message : 'Failed to update admin user',
        };
    }
}

/**
 * [Superadmin Only]: Promotes a student to admin/superadmin role
 * @param {string} userId - ID of student to promote
 * @param {'admin' | 'superadmin'} targetRole - Role to promote to
 * @returns {Promise<Response<void>>}
 */
export async function promoteToAdmin(userId: string, targetRole: 'admin' | 'superadmin'): Promise<Response<void>> {
    try {
        // Verify superadmin privileges
        const currentUser = await verifyAdmin(SUPERADMIN_LABELS);
        if (!currentUser.isAdmin) {
            throw new Error('Unauthorized: Requires superadmin privileges');
        }

        const { users } = await createAdminClient();

        // Verify user exists and is a student
        const user = await users.get(userId);
        if (!user.labels.includes('student')) {
            throw new Error('User is not a student');
        }

        // Update user labels to new role
        await users.updateLabels(userId, [targetRole]);

        // Revalidate admin pages
        revalidatePath('/admin/users');

        return {
            success: true,
            message: `User promoted to ${targetRole} successfully`,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to promote user',
        };
    }
}

// Add new function to get students
export async function getStudents(): Promise<Response<{ users: Preference[] }>> {
    try {
        const currentUser = await verifyAdmin(SUPERADMIN_LABELS);
        if (!currentUser.isAdmin) {
            throw new Error('Unauthorized: Requires superadmin privileges');
        }
        const { users } = await createAdminClient();
        const result = await users.list([Query.contains('labels', ['student'])]);
        return {
            success: true,
            data: {
                users: result.users.map(sanitizePreference),
            },
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch students',
        };
    }
}
