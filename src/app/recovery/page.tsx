'use client';

import React, { FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { updateRecovery } from '@/actions/auth';
import Invalid from './Invalid';

const passwordSchema = z
    .object({
        password: z.string().min(8, 'Password must be at least 8 characters long.'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
    });

const ResetPasswordPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams?.get('userId');
    const secret = searchParams?.get('secret');

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
                success: (result) => {
                    setTimeout(() => router.push('/login'), 2000);
                    return result.message || 'Password reset successfully';
                },
                error: (err: Error) => err.message || 'Failed to reset password',
            });
        } catch (err) {
            if (err instanceof z.ZodError) {
                toast.error(err.errors[0]?.message || 'Validation error');
            }
        }
    };

    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader className="space-y-1 p-6">
                    <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
                    <CardDescription className="text-center">Enter your new password below</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4 p-6">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Enter your new password"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="Confirm your new password"
                                required
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">Password must be at least 8 characters long.</p>
                        <Button type="submit" className="w-full">
                            Reset Password
                        </Button>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
};

export default ResetPasswordPage;
