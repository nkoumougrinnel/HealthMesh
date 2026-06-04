import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

export default function KpiCard({
  label,
  value,
  sub,
  accent = 'border-[#E8621A]',
  icon: Icon,
  valueClass = 'text-[#0B1D35]',
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon?: LucideIcon;
  valueClass?: string;
}) {
  return (
    <Card className={`p-4 md:p-6 border-l-4 ${accent} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs md:text-sm text-[#64748B] font-medium">{label}</p>
          <p className={`text-2xl md:text-3xl font-bold mt-1 ${valueClass}`}>{value}</p>
          {sub && <p className="text-xs font-semibold mt-1 text-[#64748B]">{sub}</p>}
        </div>
        {Icon && <Icon className={`w-8 h-8 opacity-15 ${valueClass}`} />}
      </div>
    </Card>
  );
}
