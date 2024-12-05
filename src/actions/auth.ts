'use server';

import cookies from '@/cookies';
import { createAdminClient, createSessionClient, createPublicClient } from '@/lib/appwrite/config';
import { Response, UserResponse } from '@/data/response.type';
import { ID } from 'node-appwrite';
import { redirect } from 'next/navigation';

/**
 * Retrieves the user information based on the session cookie.
 *
 * @returns {Promise<UserResponse>} A promise that resolves to a UserResponse object.
 * The response object contains:
 * - `success`: A boolean indicating whether the user retrieval was successful.
 * - `message`: A string message providing additional information about the result.
 * - `data`: The user data if the retrieval was successful, otherwise null.
 *
 * @throws Will return a response with `success` set to false and an appropriate message if:
 * - No session cookie is found.
 * - There is an error during the user retrieval process.
 */
export async function getUser(): Promise<UserResponse> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
        return { success: false, message: 'No session cookie found' };
    }
    try {
        const client = await createSessionClient(sessionCookie.value);
        const user = await client.account.get();

        return { success: true, message: 'User retrieved successfully', data: user };
    } catch {
        return { success: false, message: 'Failed to retrieve user', data: null };
    }
}

/**
 * Creates a session for a user with the provided email and password.
 *
 * @param {Object} params - The parameters for creating a session.
 * @param {string} params.email - The email of the user.
 * @param {string} params.password - The password of the user.
 * @returns {Promise<Response>} A promise that resolves to a response object indicating the success or failure of the session creation.
 *
 * @throws {Error} If an error occurs during session creation.
 */
export async function createSession({ email, password }: { email: string; password: string }): Promise<Response> {
    const cookieStore = await cookies();
    const { account } = await createAdminClient();

    try {
        const session = await account.createEmailPasswordSession(email, password);

        // Set the session cookie
        cookieStore.set('session', session.secret, {
            httpOnly: true,
            sameSite: 'strict',
            secure: true,
            expires: new Date(session.expire),
            path: '/',
        });

        updatePrefs({ last_login: new Date().toISOString() });
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' };
    } finally {
        redirect('/inventory');
    }
}

/**
 * Deletes the current user session by performing the following actions:
 * 1. Retrieves the session cookie from the cookie store.
 * 2. Creates a session client using the session cookie value.
 * 3. Deletes the current session using the session client.
 * 4. Deletes the 'session' and 'user' cookies from the cookie store.
 *
 * @async
 * @function deleteSession
 * @returns {Promise<void>} A promise that resolves when the session is deleted.
 */
export async function deleteSession() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    try {
        const { account } = await createSessionClient(sessionCookie?.value);
        await account.deleteSession('current');
    } finally {
        cookieStore.delete('session');
        redirect('/login');
    }
}

/**
 * Creates a new user account with preferences
 * @param values User information and preferences
 */
export async function createUser(values: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    studentId?: string;
    program?: string;
}): Promise<Response> {
    const { users, account } = await createAdminClient();

    const userId = ID.unique();
    try {
        // Create account
        await account.create(userId, values.email, values.password, values.name);

        // Set user preferences
        await users.updatePrefs(userId, {
            last_login: new Date().toISOString(),
            studentId: values.studentId || '',
            program: values.program || '',
        });

        // Set user role
        await users.updateLabels(userId, ['student']);

        const cookieStore = await cookies();

        // Create session
        const session = await account.createEmailPasswordSession(values.email, values.password);

        // Set session cookie
        cookieStore.set('session', session.secret, {
            httpOnly: true,
            sameSite: 'strict',
            secure: true,
            expires: new Date(session.expire),
            path: '/',
        });

        return { success: true, message: 'User created successfully' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : String(error),
        };
    } finally {
        redirect('/inventory');
    }
}

/**
 * Changes the user's password
 * @param oldPassword Current password
 * @param newPassword New password
 * @returns Promise<Response>
 */
export async function updatePassword(oldPassword: string, newPassword: string): Promise<Response> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
        return { success: false, message: 'No session cookie found' };
    }

    try {
        const { account } = await createSessionClient(sessionCookie.value);

        // Update password using Appwrite account API
        await account.updatePassword(newPassword, oldPassword);

        return { success: true, message: 'Password updated successfully' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update password',
        };
    }
}

/**
 * Changes the user's email address
 * @param password Current password for verification
 * @param newEmail New email address
 * @returns Promise<Response>
 */
export async function updateEmail(password: string, newEmail: string): Promise<Response> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
        return { success: false, message: 'No session cookie found' };
    }

    try {
        const { account } = await createSessionClient(sessionCookie.value);

        // Update email using Appwrite account API
        await account.updateEmail(newEmail, password);

        return { success: true, message: 'Email updated successfully' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update email',
        };
    }
}

/**
 * Changes the user's phone number
 * @param password Current password for verification
 * @param phone New phone number in E.164 format
 * @returns Promise<Response>
 */
export async function updatePhone(password: string, phone: string): Promise<Response> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
        return { success: false, message: 'No session cookie found' };
    }

    try {
        const { account } = await createSessionClient(sessionCookie.value);

        // Update phone using Appwrite account API
        await account.updatePhone(phone, password);

        return { success: true, message: 'Phone number updated successfully' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update phone number',
        };
    }
}

/**
 * Changes the user's name in both account and user collection
 * @param name New name for the user
 * @returns Promise<Response>
 */
export async function updateName(name: string): Promise<Response> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
        return { success: false, message: 'No session cookie found' };
    }

    try {
        const { account } = await createSessionClient(sessionCookie.value);

        // Update name in Appwrite account
        await account.updateName(name);

        return { success: true, message: 'Name updated successfully' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update name',
        };
    }
}

/**
 * Updates the user's preferences with any valid properties
 * @param prefs Object containing preference key-value pairs
 * @returns Promise<Response>
 */
export async function updatePrefs(prefs: Record<string, string>): Promise<Response> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
        return { success: false, message: 'No session cookie found' };
    }

    try {
        const { account } = await createSessionClient(sessionCookie.value);

        // Get existing preferences
        const existingPrefs = await account.getPrefs();

        // Merge existing prefs with new prefs
        const updatedPrefs = {
            ...existingPrefs,
            ...prefs,
        };

        // Update user preferences
        await account.updatePrefs(updatedPrefs);

        return { success: true, message: 'Preferences updated successfully' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update preferences',
        };
    }
}

/**
 * Generates a recovery email for the specified user
 * @param email The email of the user to send the recovery email to
 * @returns Promise<Response>
 */
export async function generateRecovery(email: string): Promise<Response> {
    try {
        const { account } = await createPublicClient();
        const recoveryUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/recovery`;

        await account.createRecovery(email, recoveryUrl);

        return { success: true, message: 'Recovery email sent successfully' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to send recovery email',
        };
    }
}

/**
 * Updates the recovery for a user account
 * @param userId The ID of the user
 * @param secret The secret from the recovery email
 * @param password The new password
 * @param confirmPassword Password confirmation
 * @returns Promise<Response>
 */
export async function updateRecovery(userId: string, secret: string, password: string): Promise<Response> {
    try {
        const { account } = await createPublicClient();

        await account.updateRecovery(userId, secret, password);

        return {
            success: true,
            message: 'Password recovery completed successfully',
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update password',
        };
    }
}
