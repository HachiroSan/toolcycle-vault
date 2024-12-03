import ProfilePanel from './ProfilePanel';

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-7xl mx-auto p-6 pt-8">
                <div className="space-y-2.5 mb-8">
                    <nav className="flex items-center text-sm text-muted-foreground">
                        <span>User</span>
                        <span className="mx-2">/</span>
                        <span className="font-medium text-foreground">Profile</span>
                    </nav>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Profile</h1>
                </div>
                <ProfilePanel />
            </div>
        </div>
    );
}
