'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { migrateItemCategories } from '@/actions/inventory';
import { toast } from 'sonner';

export default function MigrateCategoriesPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [migrationResult, setMigrationResult] = useState<{
        success: boolean;
        message?: string;
        data?: { updated: number; total: number };
    } | null>(null);

    const handleMigration = async () => {
        setIsLoading(true);
        setMigrationResult(null);

        try {
            const result = await migrateItemCategories();
            setMigrationResult({
                success: result.success,
                message: result.message,
                data: result.data || undefined
            });
            
            if (result.success) {
                toast.success(result.message || 'Migration completed successfully');
            } else {
                toast.error(result.message || 'Migration failed');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Migration failed';
            setMigrationResult({
                success: false,
                message: errorMessage
            });
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-4xl mx-auto p-6 pt-8">
                <div className="space-y-2.5 mb-8">
                    <nav className="flex items-center text-sm text-muted-foreground">
                        <span>Admin</span>
                        <span className="mx-2">/</span>
                        <span className="font-medium text-foreground">Migrate Categories</span>
                    </nav>
                    <h1 className="text-3xl font-bold tracking-tight">Category Migration</h1>
                    <p className="text-muted-foreground">
                        Add categories to existing inventory items based on their machine type.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Category Migration Tool
                        </CardTitle>
                        <CardDescription>
                            This tool will add default categories to existing items in your inventory.
                            Items with type "turning" will get "General Turning" category, and items with 
                            type "milling" will get "Flat end mill" category. Items with other types will 
                            remain unchanged.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Important:</strong> This migration will only update items that don't 
                                already have a category. It's safe to run multiple times.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Migration Details</h3>
                            <div className="grid gap-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Turning items:</span>
                                    <span>Will get "General Turning" category</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Milling items:</span>
                                    <span>Will get "Flat end mill" category</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Other items:</span>
                                    <span>Will remain unchanged</span>
                                </div>
                            </div>
                        </div>

                        {migrationResult && (
                            <Alert variant={migrationResult.success ? "default" : "destructive"}>
                                {migrationResult.success ? (
                                    <CheckCircle className="h-4 w-4" />
                                ) : (
                                    <AlertCircle className="h-4 w-4" />
                                )}
                                <AlertDescription>
                                    {migrationResult.message || 'Operation completed'}
                                    {migrationResult.data && (
                                        <div className="mt-2 text-sm">
                                            Updated: {migrationResult.data.updated} out of {migrationResult.data.total} items
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex justify-center">
                            <Button
                                onClick={handleMigration}
                                disabled={isLoading}
                                className="w-full sm:w-auto"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Running Migration...
                                    </>
                                ) : (
                                    <>
                                        <Database className="mr-2 h-4 w-4" />
                                        Run Category Migration
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 