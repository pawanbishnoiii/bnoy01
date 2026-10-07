export default function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-white">
      <div className="aspect-video bg-gray-200 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 w-12 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="h-9 w-full bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
