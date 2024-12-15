'use client';

import { useState } from 'react';
import { Role } from '@/components/shared/RoleBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    CalendarIcon,
    MailIcon,
    PhoneIcon,
    BookOpenIcon,
    UserIcon,
    KeyIcon,
    Settings2,
    Shield,
    User,
    PencilIcon,
    LucideIcon,
} from 'lucide-react';
import RoleBadge from '@/components/shared/RoleBadge';
import ChangePasswordForm from './form/PasswordForm';
import ChangeEmailForm from './form/EmailForm';
import EditDetailsForm from './form/DetailsForm';
import ChangePhoneForm from './form/PhoneForm';
import { useUser } from '@/hooks/useUser';
import { deleteSession, updatePrefs } from '@/actions/auth';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';
import { CldUploadButton, CldImage } from 'next-cloudinary';

interface InfoItemProps {
    icon: LucideIcon;
    label: string;
    value: string | React.ReactNode;
    warning?: boolean;
}

interface SecurityActionProps {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
}

interface UserPreferences {
    avatar_img_url?: string;
    studentId?: string;
    program?: string;
    last_login?: string;
}

interface User {
    $id?: string;
    name?: string;
    email?: string;
    phone?: string;
    labels: string[];
    prefs: UserPreferences;
    passwordUpdate?: string;
}

const InfoItem = ({ icon: Icon, label, value, warning = false }: InfoItemProps) => (
    <div
        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
            warning ? 'bg-yellow-50/50' : 'hover:bg-muted/60'
        }`}
    >
        <div className={`p-2 rounded-full ${warning ? 'bg-yellow-100' : 'bg-muted'}`}>
            <Icon className={`w-4 h-4 ${warning ? 'text-yellow-600' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={`text-sm font-medium ${warning ? 'text-yellow-600' : ''}`}>{value}</span>
        </div>
    </div>
);

const SecurityAction = ({ icon: Icon, label, onClick }: SecurityActionProps) => (
    <Button onClick={onClick} variant="outline" className="w-full justify-start p-4 h-auto">
        <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-muted">
                <Icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium">{label}</span>
        </div>
    </Button>
);

type TabId = 'info' | 'security' | 'edit' | 'changePassword' | 'changeEmail' | 'changePhone';

export default function ProfilePanel() {
    const [activeTab, setActiveTab] = useState<TabId>('info');
    const { user, refresh, clearState } = useUser();

    interface UploadResult {
        info?:
            | {
                  secure_url?: string;
              }
            | string;
    }

    const handleUpload = async (result: UploadResult) => {
        const imageUrl = typeof result.info === 'string' ? result.info : result.info?.secure_url;
        if (imageUrl) {
            try {
                const response = await updatePrefs({ avatar_img_url: imageUrl });
                if (response.success) {
                    toast.success('Avatar updated successfully');
                    refresh();
                } else {
                    toast.error('Failed to update avatar');
                }
            } catch {
                toast.error('Failed to save avatar');
            }
        }
    };

    const handleLogout = async () => {
        try {
            toast.loading('Signing out...');
            clearState();
            await deleteSession();
        } catch {
            // console.error('Logout error:', error);
        } finally {
            toast.dismiss();
            toast.success('Successfully signed out');
        }
    };

    const mainTabs = [
        { id: 'info' as const, label: 'Overview', icon: User },
        { id: 'security' as const, label: 'Security', icon: Shield },
        { id: 'edit' as const, label: 'Settings', icon: Settings2 },
    ];

    return (
        <div className="container mx-auto py-10 px-4">
            <Card className="max-w-5xl mx-auto overflow-hidden md:h-[600px] shadow-lg">
                <div className="flex flex-col md:flex-row h-full">
                    <div className="md:w-1/3 bg-gradient-to-b from-primary/5 to-primary/10 p-8 flex flex-col items-center justify-start space-y-6">
                        <div className="relative group">
                            <Avatar className="w-full h-full shadow-lg">
                                {user?.prefs?.avatar_img_url ? (
                                    <CldImage
                                        src={user.prefs.avatar_img_url}
                                        width={200}
                                        height={200}
                                        alt={user?.name || ''}
                                        crop="fill"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <AvatarFallback className="w-[200px] h-[200px] flex items-center justify-center text-4xl">
                                        {user?.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase() || '?'}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <CldUploadButton
                                uploadPreset="avatar"
                                className="absolute inset-0 flex items-center justify-center"
                                onSuccess={handleUpload}
                                options={{
                                    sources: ['local', 'url', 'camera'],
                                    resourceType: 'image',
                                    maxFiles: 1,
                                    cropping: true,
                                    publicId: user?.$id,
                                    folder: 'avatars',
                                }}
                            >
                                <div className="w-full h-full rounded-full opacity-0 group-hover:opacity-100 bg-black/50 transition-all duration-200 flex flex-col items-center justify-center">
                                    <PencilIcon className="h-6 w-6 text-white mb-1" />
                                    <span className="text-white text-sm">Edit</span>
                                </div>
                            </CldUploadButton>
                            <Badge className="absolute bottom-2 right-6 bg-primary/90 hover:bg-primary">Active</Badge>
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">{user?.name}</h2>
                            <RoleBadge role={user?.labels[0] as Role} />
                        </div>
                        <Button onClick={handleLogout} variant="outline" className="w-full mt-auto">
                            Sign Out
                        </Button>
                    </div>

                    <CardContent className="md:w-2/3 p-0 flex flex-col flex-grow">
                        <Tabs
                            value={activeTab}
                            onValueChange={setActiveTab as (value: string) => void}
                            className="w-full h-full flex flex-col"
                        >
                            <TabsList className="flex justify-between p-1 m-4 bg-muted/60">
                                {mainTabs.map(({ id, label, icon: Icon }) => (
                                    <TabsTrigger
                                        key={id}
                                        value={id}
                                        className="flex-1 data-[state=active]:bg-background"
                                    >
                                        <div className="flex items-center justify-center space-x-2">
                                            <Icon className="w-4 h-4" />
                                            <span>{label}</span>
                                        </div>
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <div className="flex-grow overflow-auto px-4">
                                <TabsContent value="info" className="h-full mt-0 p-4">
                                    <div className="space-y-4">
                                        <InfoItem icon={MailIcon} label="Email Address" value={user?.email || ''} />
                                        <InfoItem
                                            icon={PhoneIcon}
                                            label="Phone Number"
                                            value={user?.phone || 'Not Specified'}
                                            warning={!user?.phone}
                                        />
                                        <InfoItem
                                            icon={UserIcon}
                                            label="Student ID"
                                            value={user?.prefs.studentId || 'Not Specified'}
                                            warning={!user?.prefs.studentId}
                                        />
                                        <InfoItem
                                            icon={BookOpenIcon}
                                            label="Program"
                                            value={user?.prefs.program || 'Not Specified'}
                                            warning={!user?.prefs.program}
                                        />
                                        <InfoItem
                                            icon={CalendarIcon}
                                            label="Last Login"
                                            value={
                                                user?.prefs.last_login ? formatDateTime(user.prefs.last_login) : 'N/A'
                                            }
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="security" className="h-full mt-0 p-4">
                                    <div className="space-y-4">
                                        <SecurityAction
                                            icon={MailIcon}
                                            label="Change Email Address"
                                            onClick={() => setActiveTab('changeEmail')}
                                        />
                                        <SecurityAction
                                            icon={KeyIcon}
                                            label="Change Password"
                                            onClick={() => setActiveTab('changePassword')}
                                        />
                                        <SecurityAction
                                            icon={PhoneIcon}
                                            label="Change Phone Number"
                                            onClick={() => setActiveTab('changePhone')}
                                        />
                                        <div className="mt-6">
                                            <InfoItem
                                                icon={CalendarIcon}
                                                label="Last Password Change"
                                                value={
                                                    user?.passwordUpdate ? formatDateTime(user.passwordUpdate) : 'N/A'
                                                }
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="edit" className="h-full mt-0 p-4">
                                    <EditDetailsForm
                                        userDetails={{
                                            name: user?.name || '',
                                            program: user?.prefs.program,
                                            studentId: user?.prefs.studentId,
                                        }}
                                        onSuccess={() => {
                                            refresh();
                                            setActiveTab('info');
                                            toast.success('Profile updated successfully');
                                        }}
                                    />
                                </TabsContent>

                                <TabsContent value="changePassword" className="h-full mt-0 p-4">
                                    <div className="space-y-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveTab('security')}
                                            className="mb-4"
                                        >
                                            ← Back to Security
                                        </Button>
                                        <ChangePasswordForm
                                            onSuccess={() => {
                                                refresh();
                                                setActiveTab('security');
                                                toast.success('Password changed successfully');
                                            }}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="changeEmail" className="h-full mt-0 p-4">
                                    <div className="space-y-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveTab('security')}
                                            className="mb-4"
                                        >
                                            ← Back to Security
                                        </Button>
                                        <ChangeEmailForm
                                            currentEmail={user?.email || ''}
                                            onSuccess={() => {
                                                refresh();
                                                setActiveTab('security');
                                                toast.success('Email changed successfully');
                                            }}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="changePhone" className="h-full mt-0 p-4">
                                    <div className="space-y-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveTab('security')}
                                            className="mb-4"
                                        >
                                            ← Back to Security
                                        </Button>
                                        <ChangePhoneForm
                                            phone={user?.phone || ''}
                                            onSuccess={() => {
                                                refresh();
                                                setActiveTab('security');
                                                toast.success('Phone number changed successfully');
                                            }}
                                        />
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}
