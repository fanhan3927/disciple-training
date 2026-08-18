type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <section className="mx-auto w-full max-w-md rounded-lg border border-mist bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-semibold leading-tight tracking-normal text-ink">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-ink/72">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
