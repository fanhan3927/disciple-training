type BoundaryBadgeProps = {
  label: string;
  tone: "neutral" | "safe" | "warning";
};

const toneClasses: Record<BoundaryBadgeProps["tone"], string> = {
  neutral: "border-mist bg-white text-ink",
  safe: "border-mist bg-mist text-pine",
  warning: "border-gold/40 bg-gold/10 text-ink",
};

export function BoundaryBadge({ label, tone }: BoundaryBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
