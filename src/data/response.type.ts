import { Models } from 'node-appwrite';

export interface Response<T = void> {
    success: boolean;
    message?: string;
    data?: T | null;
}

export interface SessionFormData {
    email: string;
    password: string;
}

export interface UserFormData extends SessionFormData {
    name: string;
}

export type UserResponse = Response<Models.User<Models.Preferences>>;
