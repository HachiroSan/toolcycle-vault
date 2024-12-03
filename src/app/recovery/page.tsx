'use client';

import React, { FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { updateRecovery } from '@/actions/auth';
import Invalid from './Invalid';

function LoadingState() {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
    );
}

const passwordSchema = z
    .object({
        password: z.string().min(8, 'Password must be at least 8 characters long.'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
    });

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    if (!userId || !secret) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <Invalid />
            </div>
        );
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            password: formData.get('password') as string,
            confirmPassword: formData.get('confirmPassword') as string,
        };

        try {
            passwordSchema.parse(data);

            await toast.promise(updateRecovery(userId, secret, data.password), {
                loading: 'Resetting password...',
                success: () => {
                    router.push('/sign-in');
                    return 'Password reset successfully!';
                },
                error: 'Failed to reset password.',
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                error.errors.forEach((err) => {
                    toast.error(err.message);
                });
            } else {
                toast.error('An unexpected error occurred.');
            }
        }
    };

    return (
        <Suspense fallback={<LoadingState />}>
            {!userId || !secret ? (
                <div className="flex h-screen w-screen items-center justify-center">
                    <Invalid />
                </div>
            ) : (
                <div className="flex h-screen w-screen items-center justify-center">
                    <Card className="w-[380px]">
                        <CardHeader>
                            <CardTitle>Reset Password</CardTitle>
                            <CardDescription>Enter your new password below.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="Enter your new password"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        placeholder="Confirm your new password"
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    Reset Password
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </Suspense>
    );
}
