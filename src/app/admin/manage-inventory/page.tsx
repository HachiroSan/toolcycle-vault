import InventoryTable from './InventoryTable';

export default function InventoryManagementPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-7xl mx-auto p-6 pt-8">
                <div className="space-y-2.5 mb-8">
                    <nav className="flex items-center text-sm text-muted-foreground">
                        <span>Admin</span>
                        <span className="mx-2">/</span>
                        <span className="font-medium text-foreground">Inventory</span>
                    </nav>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
                </div>
                <InventoryTable />
            </div>
        </div>
    )
}
