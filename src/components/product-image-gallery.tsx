'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  defaultImage?: string;
}

export function ProductImageGallery({ images, productName, defaultImage }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const displayImages = images.length > 0 ? images : (defaultImage ? [defaultImage] : []);
  const currentImage = displayImages[selectedIndex] || defaultImage;

  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  if (displayImages.length === 0) {
    return (
      <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No image available</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative group">
        <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-muted">
          <Image
            src={currentImage}
            alt={productName}
            fill
            className="object-cover cursor-zoom-in"
            onClick={() => setIsZoomed(true)}
            priority
          />
          {displayImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {displayImages.map((_, index) => (
                  <button
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === selectedIndex ? 'w-8 bg-primary' : 'w-2 bg-background/50'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(index);
                    }}
                  />
                ))}
              </div>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(true);
            }}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Thumbnail Gallery */}
        {displayImages.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-4">
            {displayImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                  index === selectedIndex
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-transparent hover:border-muted-foreground/50'
                }`}
              >
                <Image
                  src={image}
                  alt={`${productName} - View ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-7xl w-full p-0 bg-transparent border-0">
          <div className="relative w-full h-[90vh] bg-background rounded-lg">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-background/80 hover:bg-background"
              onClick={() => setIsZoomed(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            {displayImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
            <div className="relative w-full h-full">
              <Image
                src={currentImage}
                alt={productName}
                fill
                className="object-contain"
                priority
              />
            </div>
            {displayImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-background/80 px-4 py-2 rounded-full">
                {displayImages.map((_, index) => (
                  <button
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === selectedIndex ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/50'
                    }`}
                    onClick={() => setSelectedIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

