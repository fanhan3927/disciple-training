type TextFieldProps = {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
};

export function TextField({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  autoComplete,
  minLength,
}: TextFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        className="min-h-11 rounded-md border border-mist bg-white px-3 py-2 text-base font-normal text-ink outline-none transition focus:border-pine focus-visible:shadow-focus"
      />
    </label>
  );
}
