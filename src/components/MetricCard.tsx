import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value?: string;
  change?: string;
  positive?: boolean;
  loading?: boolean;
  subtitle?: string;
}

export function MetricCard({
  label,
  value,
  change,
  positive,
  loading = false,
  subtitle,
}: MetricCardProps) {
  if (loading || !value) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <p className="text-sm font-medium text-gray-400 mb-2">{label}</p>
        <div className="h-8 bg-gray-700 rounded animate-pulse w-2/3" />
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <p className="text-sm font-medium text-gray-400 mb-2">{label}</p>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>

      {change && (
        <p className={cn(
          'text-sm font-medium',
          positive === true ? 'text-green-400' :
          positive === false ? 'text-red-400' : 'text-gray-400'
        )}>
          {change}
        </p>
      )}

      {subtitle && <p className="text-xs text-gray-500 mt-3">{subtitle}</p>}
    </div>
  );
}
