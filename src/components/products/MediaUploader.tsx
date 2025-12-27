'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Video, Image as ImageIcon, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface MediaUploaderProps {
  images?: string[];
  videoUrl?: string;
  onImagesChange: (images: string[]) => void;
  onVideoChange: (videoUrl: string | undefined) => void;
}

export function MediaUploader({
  images = [],
  videoUrl,
  onImagesChange,
  onVideoChange,
}: MediaUploaderProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const maxImages = 5;
    const remainingSlots = maxImages - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Limit Reached',
        description: `You can upload up to ${maxImages} images.`,
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'products');

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onImagesChange([...images, ...uploadedUrls]);
      
      toast({
        title: 'Success',
        description: `${uploadedUrls.length} image(s) uploaded successfully.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to upload images. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoUpload = async (file: File | null) => {
    if (!file) return;

    // Check file size (max 15MB for video)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Video must be less than 15MB. Keep it short (15 seconds max).',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'products/videos');

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onVideoChange(data.url);
      
      toast({
        title: 'Success',
        description: 'Video uploaded successfully.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to upload video. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const removeVideo = () => {
    onVideoChange(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Media (Video & Photos)</div>
      
      {/* Video Upload - Priority */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Video (15 seconds max - Priority)
            </Label>
            {videoUrl ? (
              <div className="relative">
                <video
                  src={videoUrl}
                  controls
                  className="w-full rounded-lg max-h-64"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeVideo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => handleVideoUpload(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Video className="mr-2 h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Add Video (Recommended)'}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Video shows the "shine" of fabrics or "texture" of snacks better
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Upload */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Photos ({images.length}/5)
            </Label>
            
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <Image
                      src={url}
                      alt={`Product image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {images.length < 5 && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Add Photos'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

