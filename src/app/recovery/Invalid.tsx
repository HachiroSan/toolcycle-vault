import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Invalid = () => {
    return (
        <div className="w-full max-w-lg">
            <Card className="border-0 sm:border shadow-none sm:shadow">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Invalid Reset Link</CardTitle>
                    <CardDescription className="text-center">
                        The password reset link appears to be invalid or expired
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertDescription>
                            Please request a new password reset link from the login page.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
};

export default Invalid;
