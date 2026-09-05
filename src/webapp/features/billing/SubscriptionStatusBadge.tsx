/*
Possible statuses:
- active
- cancelled
- expired
- paused
- past_due
- unpaid
*/

const statuses: Record<string, [string, string]> = {
  active: ["Ativo", "text-success"],
  cancelled: ["Cancelado", "text-destructive"],
  expired: ["Expirado", "text-destructive"],
  paused: ["Pausado", "text-primary"],
  past_due: ["Atrasado", "text-destructive"],
  unpaid: ["Não Pago", "text-destructive"],
};

export function SubscriptionStatusBadge(props: { status: string }) {
  const [statusFormatted, color] = statuses[props.status] ?? [props.status, ""];
  return <span className={color}>{statusFormatted}</span>;
}
