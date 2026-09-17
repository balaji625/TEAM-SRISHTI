/**
 * SkeletonLoader — animated content placeholder.
 */

export const SkeletonLine = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
    <SkeletonLine className="h-4 w-1/3" />
    <SkeletonLine className="h-3 w-full" />
    <SkeletonLine className="h-3 w-4/5" />
    <SkeletonLine className="h-3 w-2/3" />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, j) => (
          <SkeletonLine key={j} className="h-4" />
        ))}
      </div>
    ))}
  </div>
);

const SkeletonLoader = { SkeletonLine, SkeletonCard, SkeletonTable };
export default SkeletonLoader;
