import { Models } from 'node-appwrite';

export type User = Models.User<Models.Preferences>;

export type SanitizedUser = {
    $id: string;
    name: string;
    email: string;
    phone: string;
    passwordUpdate: string;
    registration: string;
    labels: string[];
};
