import { Badge } from '@/components/ui/badge';
import { triageStyle } from '@/lib/health';

export default function TriageBadge({ level, pulse }: { level?: string | null; pulse?: boolean }) {
  const s = triageStyle(level);
  return (
    <Badge className={`${s.bg} ${s.text} font-bold ${pulse && level === 'ROUGE' ? 'animate-pulse-alert' : ''}`}>
      {level || '—'}
    </Badge>
  );
}
