type EmptyStateProps = {
  title: string;
  body: string;
};

export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <section className="rounded-md border border-dashed border-mist bg-field p-4" aria-live="polite">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-ink/68">{body}</p>
    </section>
  );
}
