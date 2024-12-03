import { Client, Databases, Account, Users } from 'node-appwrite';

const createAdminClient = async () => {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    return {
        get account() {
            return new Account(client);
        },

        get databases() {
            return new Databases(client);
        },

        get users() {
            return new Users(client);
        }
    };
};

const createSessionClient = async (session) => {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

    if (session) {
        client.setSession(session);
    }

    return {
        get account() {
            return new Account(client);
        },

        get databases() {
            return new Databases(client);
        },
    };
};

const createPublicClient = async () => {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

    return {
        get account() {
            return new Account(client);
        },

        get databases() {
            return new Databases(client);
        },
    };
};

export { createAdminClient, createSessionClient, createPublicClient };
