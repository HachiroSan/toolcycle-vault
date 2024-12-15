import { updateItemImage } from '@/actions/inventory';
import { useQueryClient } from '@tanstack/react-query';
import { Package2, PencilIcon, Eye } from 'lucide-react';
import { CldUploadWidget, CldImage } from 'next-cloudinary';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useState } from 'react';
import { DialogTitle } from '@radix-ui/react-dialog';

interface ImageUploadProps {
    itemId: string;
    imageUrl?: string;
    onUploadSuccess: () => void;
}

const ImageUploadWidget = ({ itemId, imageUrl, onUploadSuccess }: ImageUploadProps) => {
    const queryClient = useQueryClient();
    const [previewOpen, setPreviewOpen] = useState(false);

    const handleUpload = async (result: { info?: string | { public_id: string } }) => {
        if (typeof result.info === 'object' && result.info && 'public_id' in result.info) {
            toast.promise(updateItemImage(itemId, result.info.public_id), {
                loading: imageUrl ? 'Updating image...' : 'Uploading image...',
                success: () => {
                    queryClient.invalidateQueries({ queryKey: ['inventory'] });
                    onUploadSuccess();
                    return `Image ${imageUrl ? 'updated' : 'uploaded'} successfully`;
                },
                error: `Failed to ${imageUrl ? 'update' : 'upload'} image`,
            });
        }
    };

    if (!imageUrl) {
        return (
            <div className="h-20 w-20 rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors mx-auto">
                <CldUploadWidget
                    uploadPreset="product_image"
                    options={{ maxFiles: 1, resourceType: 'image', publicId: itemId }}
                    onSuccess={handleUpload}
                >
                    {({ open }) => (
                        <button
                            onClick={() => open()}
                            className="w-full h-full flex items-center justify-center hover:bg-muted/50 transition-colors"
                        >
                            <Package2 className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                        </button>
                    )}
                </CldUploadWidget>
            </div>
        );
    }

    return (
        <>
            <div className="relative h-20 w-20 rounded-md overflow-hidden mx-auto group">
                <CldImage
                    src={imageUrl}
                    alt="Item image"
                    fill
                    sizes="128px"
                    className="object-cover"
                    priority={false}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setPreviewOpen(true);
                        }}
                        className="text-white hover:text-primary transition-colors"
                    >
                        <Eye className="h-5 w-5" />
                    </button>
                    <CldUploadWidget
                        uploadPreset="product_image"
                        options={{ maxFiles: 1, resourceType: 'image', publicId: itemId }}
                        onSuccess={handleUpload}
                    >
                        {({ open }) => (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    open();
                                }}
                                className="text-white hover:text-primary transition-colors"
                            >
                                <PencilIcon className="h-5 w-5" />
                            </button>
                        )}
                    </CldUploadWidget>
                </div>
            </div>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogTitle className="hidden"></DialogTitle>
                <DialogContent className="max-w-3xl p-0">
                    <div className="relative w-full aspect-square">
                        <CldImage
                            src={imageUrl}
                            alt="Item image preview"
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 768px"
                            priority
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ImageUploadWidget;
