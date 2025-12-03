
'use client';

import { useBrandingSettings } from "@/lib/firebase/firestore/branding";
import Image from "next/image";
import { IkmLogo as StaticLogo } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";

export const DynamicLogo = ({ className = "w-auto h-8" }: { className?: string }) => {
    const { data: brandingSettings, isLoading } = useBrandingSettings();

    if (isLoading) {
        return <Skeleton className="h-8 w-32" />
    }

    if (brandingSettings?.logoUrl) {
        return (
            <Image 
                src={brandingSettings.logoUrl} 
                alt="Marketplace Logo" 
                width={130} 
                height={40} 
                className={className} 
                priority
            />
        )
    }

    return <StaticLogo className={className} />;
}
