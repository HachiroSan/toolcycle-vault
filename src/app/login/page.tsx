'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import LoginForm from './form/Login';
import SignupForm from './form/Signup';
import ForgotPassword from './form/Forgot';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const LoginPage = () => {
    const [activeTab, setActiveTab] = useState('login');

    const tabContent = {
        login: {
            title: 'Welcome back',
            description: 'Log in to your account',
            component: <LoginForm />,
        },
        signup: {
            title: 'Create an account',
            description: 'Sign up for ToolCycle Vault',
            component: <SignupForm />,
        },
        'forgot-password': {
            title: 'Forgot Password',
            description: 'Reset your password',
            component: <ForgotPassword />,
        },
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <Header />
            <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8 z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md sm:max-w-lg md:max-w-xl"
                >
                    <div className="sm:backdrop-blur-md sm:bg-white/70 sm:border sm:border-gray-200 sm:shadow-2xl rounded-lg overflow-hidden">
                        <div className="space-y-1 p-4 sm:p-6">
                            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800">
                                {tabContent[activeTab as keyof typeof tabContent].title}
                            </h2>
                            <p className="text-center text-base sm:text-lg text-gray-600">
                                {tabContent[activeTab as keyof typeof tabContent].description}
                            </p>
                        </div>
                        <div className="p-4 sm:p-6">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-6 sm:mb-8">
                                    <TabsTrigger value="login" className="text-sm sm:text-base">
                                        Login
                                    </TabsTrigger>
                                    <TabsTrigger value="signup" className="text-sm sm:text-base">
                                        Sign Up
                                    </TabsTrigger>
                                    <TabsTrigger value="forgot-password" className="text-sm sm:text-base">
                                        Forgot
                                    </TabsTrigger>
                                </TabsList>
                                {Object.entries(tabContent).map(([key, { component }]) => (
                                    <TabsContent key={key} value={key}>
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {component}
                                        </motion.div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default LoginPage;
