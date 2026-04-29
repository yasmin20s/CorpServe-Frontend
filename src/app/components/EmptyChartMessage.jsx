import { BarChart3 } from 'lucide-react';

/**
 * A styled empty-state placeholder for charts/graphs when data is null or empty.
 * @param {{ message?: string, className?: string }} props
 */
export default function EmptyChartMessage({ message = 'No data available for this period.', className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 py-10 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <BarChart3 className="h-6 w-6 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {message}
      </p>
    </div>
  );
}
