import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { promoteToAdmin, getStudents } from '@/actions/admin';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CldImage } from 'next-cloudinary';
import { User } from './AdminPanel';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

type PromoteRole = 'admin' | 'superadmin';

const TableSkeleton = () => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Action</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell>
                        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                    </TableCell>
                    <TableCell>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse ml-auto" />
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

export function PromoteAdminDialog({ isOpen, onClose, onSuccess }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [processingStudent, setProcessingStudent] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<PromoteRole>('admin');
    const [students, setStudents] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchStudents = async () => {
                setIsFetching(true);
                setError(null);
                try {
                    const response = await getStudents();
                    if (response.success && response.data) {
                        const mappedStudents: User[] = response.data.users.map((user) => ({
                            id: user.$id,
                            name: user.name,
                            email: user.email,
                            role: user.labels[0] as 'student',
                            prefs: user.prefs,
                        }));
                        setStudents(mappedStudents);
                    } else {
                        setError(response.message || 'Failed to fetch students');
                    }
                } catch {
                    setError('Failed to fetch students');
                } finally {
                    setIsFetching(false);
                }
            };

            fetchStudents();
        }
    }, [isOpen]);

    const filteredStudents = students.filter(
        (student) =>
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePromote = async (userId: string) => {
        setProcessingStudent(userId);
        setIsLoading(true);
        try {
            const response = await promoteToAdmin(userId, selectedRole);
            if (response.success) {
                toast.success(response.message);
                onSuccess();
                onClose();
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            toast.error('Failed to promote user: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsLoading(false);
            setProcessingStudent(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Promote User to Admin</DialogTitle>
                    <DialogDescription>Select a user to promote to administrator role</DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Select value={selectedRole} onValueChange={(value: PromoteRole) => setSelectedRole(value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="superadmin">Super Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {error ? (
                        <div className="text-red-500 p-4 bg-red-50 rounded-md">{error}</div>
                    ) : isFetching ? (
                        <TableSkeleton />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead></TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-gray-500">
                                            No students found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell>
                                                <Avatar className="h-8 w-8">
                                                    {student.prefs?.avatar_img_url ? (
                                                        <CldImage
                                                            src={student.prefs.avatar_img_url}
                                                            width={32}
                                                            height={32}
                                                            alt={student.name}
                                                            crop="fill"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <AvatarFallback>
                                                            {student.name?.charAt(0) || '?'}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell>{student.email}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    onClick={() => handlePromote(student.id)}
                                                    disabled={isLoading}
                                                    size="sm"
                                                    className="min-w-[80px]"
                                                >
                                                    {processingStudent === student.id ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Processing
                                                        </>
                                                    ) : (
                                                        'Promote'
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
