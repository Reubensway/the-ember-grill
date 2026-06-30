import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const statusStyles: Record<OrderStatus, string> = {
  received: "bg-indigo-100 text-indigo-800 border-indigo-200",
  preparing: "bg-amber-100 text-amber-800 border-amber-200",
  ready: "bg-green-100 text-green-800 border-green-200",
  served: "bg-emerald-100 text-emerald-800 border-emerald-200",
  collected: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "out-for-delivery": "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
};

function formatStatus(status: OrderStatus): string {
  return status
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge className={cn(statusStyles[status], className)}>
      {formatStatus(status)}
    </Badge>
  );
}
