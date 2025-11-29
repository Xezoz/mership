import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    iconClassName?: string;
    textClassName?: string;
    showText?: boolean;
}

export function Logo({
    className,
    iconClassName,
    textClassName,
    showText = true
}: LogoProps) {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div className={cn(
                "relative w-6 h-6 border border-white/80 rounded-full flex items-center justify-center",
                iconClassName
            )}>
                <div className="w-2 h-2 bg-white rounded-full" />
            </div>
            {showText && (
                <span className={cn(
                    "text-lg font-medium tracking-tight text-white",
                    textClassName
                )}>
                    MERSHIP
                </span>
            )}
        </div>
    );
}
