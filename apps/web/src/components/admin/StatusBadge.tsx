import { Badge } from '@/components/ui/Badge';
import type { OrderStatus } from '@/types';
import { STATUS_COLOR, STATUS_DOT, STATUS_LABEL } from '@/lib/utils';

interface StatusBadgeProps {
  status: OrderStatus;
  pulse?: boolean;
}

export function StatusBadge({ status, pulse = false }: StatusBadgeProps) {
  return (
    <Badge className={STATUS_COLOR[status]}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]} ${
          pulse && status === 'pending' ? 'animate-pulse' : ''
        }`}
      />
      {STATUS_LABEL[status]}
    </Badge>
  );
}
