import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import { toast } from 'sonner';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createUser } from '@/actions/auth';
import { isRedirectError } from 'next/dist/client/components/redirect';
import { useUser } from '@/hooks/useUser';

const formSchema = z
    .object({
        name: z.string().min(2, {
            message: 'Name must be at least 2 characters.',
        }),
        email: z.string().email({
            message: 'Please enter a valid email address.',
        }),
        phone: z
            .string()
            .min(11, { message: 'Phone number must include country code and at least 10 digits' })
            .regex(/^\+[1-9]\d{0,2}[-\s]\d{3}[-\s]\d{3}[-\s]\d{4}$/, {
                message: 'Please enter a valid phone number with country code (e.g. +1 234-567-8900)',
            }),
        studentId: z.string().min(7, {
            message: 'Student ID must be at least 7 characters.',
        }),
        program: z.string().min(2, {
            message: 'Program must be at least 2 characters.',
        }),
        password: z.string().min(8, {
            message: 'Password must be at least 8 characters.',
        }),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

export default function SignUpForm() {
    const { refresh } = useUser();
    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            studentId: '',
            program: '',
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (values: {
        email: string;
        password: string;
        phone: string;
        name: string;
        studentId: string;
        program: string;
    }) => {
        toast.loading('Creating your account...', { id: 'signup' });

        try {
            const response = await createUser(values);
            if (response.success) {
                form.reset();
                toast.success('Account created successfully!', { id: 'signup' });
                router.push('/');
            } else {
                form.setError('root', {
                    type: 'manual',
                    message: response.message,
                });
                toast.error(response.message, { id: 'signup' });
            }
        } catch (error) {
            if (isRedirectError(error)) {
                toast.success('Account created successfully!', { id: 'signup' });
                form.reset();
                router.push('/inventory');
            } else {
                toast.error(`Failed to create account: ${(error as Error).message}`, { id: 'signup' });
                console.error('Signup error:', error);
            }
        } finally {
            toast.dismiss('signup');
            refresh();
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {form.formState.errors.root && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                        {form.formState.errors.root.message}
                    </div>
                )}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" autoComplete="name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="john@example.com" autoComplete="email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                                <Input
                                    type="tel"
                                    placeholder="+1 234-567-8900"
                                    autoComplete="tel"
                                    {...field}
                                    onChange={(e) => {
                                        let value = e.target.value.replace(/[^\d+]/g, '');

                                        // Handle country code formatting
                                        if (!value.startsWith('+')) {
                                            value = '+' + value;
                                        }

                                        // Format the rest of the number
                                        const numbers = value.substring(1);
                                        let formatted = '+' + numbers.substring(0, 1);
                                        if (numbers.length > 1) formatted += ' ' + numbers.substring(1, 4);
                                        if (numbers.length > 4) formatted += '-' + numbers.substring(4, 7);
                                        if (numbers.length > 7) formatted += '-' + numbers.substring(7, 11);

                                        field.onChange(formatted);
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                            <FormDescription className="text-xs text-muted-foreground">
                                Include country code (e.g. +60 for Malaysia)
                            </FormDescription>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Student ID</FormLabel>
                            <FormControl>
                                <Input placeholder="DB123456" autoComplete="student-id" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="program"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Program</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Bachelor of Mechanical Engineering"
                                    autoComplete="organization-title"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full">
                    Sign Up
                </Button>
            </form>
        </Form>
    );
}
