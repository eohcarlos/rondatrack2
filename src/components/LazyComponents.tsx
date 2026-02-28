import { lazy, Suspense, ComponentType, memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

// Loading fallback component
const TabLoadingFallback = memo(() => (
  <Card className="w-full">
    <CardContent className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </CardContent>
  </Card>
));

TabLoadingFallback.displayName = 'TabLoadingFallback';

// Lazy loaded components
export const LazyEmployeeManagement = lazy(() => 
  import('./EmployeeManagement').then(m => ({ default: m.EmployeeManagement }))
);

export const LazyCondominiumManagement = lazy(() => 
  import('./CondominiumManagement').then(m => ({ default: m.CondominiumManagement }))
);

export const LazyPositionManagement = lazy(async () => {
  const module = await import('./PositionManagement');
  return { default: module.PositionManagement };
});

export const LazyWorkedLeavesTab = lazy(() => 
  import('./WorkedLeavesTab').then(m => ({ default: m.WorkedLeavesTab }))
);

export const LazyAbsencesTab = lazy(() => 
  import('./AbsencesTab').then(m => ({ default: m.AbsencesTab }))
);

export const LazyReportsPanel = lazy(() => 
  import('./ReportsPanel').then(m => ({ default: m.ReportsPanel }))
);

export const LazyAIReportsTab = lazy(() => 
  import('./AIReportsTab').then(m => ({ default: m.AIReportsTab }))
);

export const LazyScheduleTab = lazy(() => 
  import('./ScheduleTab').then(m => ({ default: m.ScheduleTab }))
);

// Wrapper component with Suspense
interface WithSuspenseProps {
  children: React.ReactNode;
}

export const WithSuspense = memo(({ children }: WithSuspenseProps) => (
  <Suspense fallback={<TabLoadingFallback />}>
    {children}
  </Suspense>
));

WithSuspense.displayName = 'WithSuspense';
