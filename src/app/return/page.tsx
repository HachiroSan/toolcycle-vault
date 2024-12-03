import ReturnPanel from './ReturnPanel';

export default function ReturnPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-7xl mx-auto p-6 pt-8">
                <div className="space-y-2.5 mb-8">
                    <nav className="flex items-center text-sm text-muted-foreground">
                        <span>User</span>
                        <span className="mx-2">/</span>
                        <span className="font-medium text-foreground">Return</span>
                    </nav>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Return</h1>
                </div>
                <ReturnPanel />
            </div>
        </div>
    );
}
