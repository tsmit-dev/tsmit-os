"use client";

import { Skeleton } from "@/components/ui/skeleton";

type PageLayoutProps = {
  title: string;
  icon?: React.ReactNode;
  isLoading: boolean;
  canAccess: boolean;
  children: React.ReactNode;
  searchBar?: React.ReactNode;
  actionButton?: React.ReactNode;
};

export function PageLayout({
  title,
  icon,
  isLoading,
  canAccess,
  children,
  searchBar,
  actionButton,
}: PageLayoutProps) {
  if (isLoading || !canAccess) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-2/5" />
          <Skeleton className="h-10 w-1/4" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {icon}
          <h1 className="text-2xl sm:text-3xl font-bold font-headline">
            {title}
          </h1>
        </div>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {searchBar}
          {actionButton}
        </div>
      </div>
      <div className="overflow-x-auto bg-card rounded-lg shadow-sm">
        {children}
      </div>
    </div>
  );
}
