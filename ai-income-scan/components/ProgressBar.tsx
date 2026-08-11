export function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="label text-mahogany/70 text-xs">
          Vraag {current} van {total}
        </span>
        <span className="label text-chestnut text-xs">{percentage}%</span>
      </div>
      <div className="h-1.5 w-full bg-mahogany/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-chestnut rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
