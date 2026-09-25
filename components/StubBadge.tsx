type Props = {
  label: string;
  className?: string;
};

export function StubBadge({ label, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-gold-light ${className}`}
    >
      {label}
    </span>
  );
}
