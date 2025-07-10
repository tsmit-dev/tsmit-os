"use client";

import { Skeleton } from "@/components/ui/skeleton";

export type PageLayoutProps = {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  isLoading: boolean;
  canAccess: boolean;
  searchBar?: React.ReactNode;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
};

export function PageLayout({
  title,
  icon,
  description,
  isLoading,
  canAccess,
  searchBar,
  actionButton,
  children,
}: PageLayoutProps) {
  const baseClasses = "container mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-6";

  if (isLoading || !canAccess) {
    return (
      <div className={baseClasses}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-2/5" />
          <Skeleton className="h-10 w-1/4" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className={baseClasses}>
      {/* Header: icon + title */}
      <div className="flex items-center gap-2">
        {icon}
        <h1 className="text-2xl sm:text-3xl font-bold font-headline">{title}</h1>
      </div>

      {/* Description below title */}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Search bar under description */}
      {searchBar && (
        <div className="pt-4">
          {searchBar}
        </div>
      )}

      {/* Table wrapper with actionButton inside */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
        {/* Action button aligned left inside table container */}
        {actionButton && (
          <div className="p-4">
            {actionButton}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
