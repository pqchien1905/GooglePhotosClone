import * as React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0 - 100
}

export function Progress({ value = 0, className = '', ...props }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 ${className}`} {...props}>
      <div className="h-full bg-blue-600 transition-all dark:bg-blue-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default Progress;
