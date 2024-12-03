import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
// import auth from "@/auth";
import { Response } from '@/data/response.type';
import { toast } from 'sonner';
import { createSession, updatePrefs } from '@/actions/auth';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z.string(),
});

const LoginForm = () => {
    const router = useRouter();
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (values: { email: string; password: string }) => {
        toast.promise(createSession(values), {
            loading: 'Signing in...',
            success: async (response: Response) => {
                if (response.success) {
                    await updatePrefs({ last_login: new Date().toISOString() });
                    form.reset();
                    router.push('/login');
                    return 'Signed in successfully!';
                } else {
                    form.setError('root', {
                        type: 'manual',
                        message: response.message,
                    });
                    throw new Error(response.message);
                }
            },
            error: 'Sign in failed',
        });
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
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input autoComplete="email" placeholder="Enter your email" {...field} />
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
                                <Input
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Sign In</Button>
            </form>
        </Form>
    );
};

export default LoginForm;
