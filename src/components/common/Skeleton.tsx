import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div 
      className={`bg-slate-200 animate-pulse rounded-md ${className}`} 
      aria-hidden="true" 
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
};

export const TableRowSkeleton: React.FC = () => {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-32" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-40" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-28" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-6 w-20 rounded-full" /></td>
      <td className="px-4 py-3.5 text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></td>
    </tr>
  );
};

export const DashboardOverviewSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};
