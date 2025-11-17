'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icon';

interface Source {
  id: string;
  name: string;
  count: number;
}

interface SourceBadgesProps {
  sources: Source[];
  className?: string;
}

export function SourceBadges({ sources, className = '' }: SourceBadgesProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <Card hover={false} className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-[var(--text-color)] flex items-center gap-2">
          <Icons.Check size={16} className="text-[var(--accent-color)]" />
          可用源 ({sources.length}):
        </span>
        {sources.map((source) => (
          <Badge 
            key={source.id} 
            variant="secondary" 
            className="text-xs"
          >
            {source.name} ({source.count})
          </Badge>
        ))}
      </div>
    </Card>
  );
}
