type LoadingSkeletonProps = {
  label: string;
};

export function LoadingSkeleton({ label }: LoadingSkeletonProps) {
  return (
    <div role="status" aria-label={label} className="grid gap-2">
      <div className="h-3 w-2/3 animate-pulse rounded-sm bg-mist" />
      <div className="h-3 w-full animate-pulse rounded-sm bg-mist" />
      <div className="h-3 w-4/5 animate-pulse rounded-sm bg-mist" />
    </div>
  );
}
