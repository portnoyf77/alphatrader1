import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Default true: rgba base + left-to-right shimmer sweep */
  shimmer?: boolean;
};

function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md",
        shimmer ? "skeleton-shimmer" : "animate-pulse bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
