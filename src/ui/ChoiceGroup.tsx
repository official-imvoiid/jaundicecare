interface ChoiceGroupProps<T extends string> {
  legend: string;
  name: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}

/** One question with a few answers: real radio buttons, drawn as a row of pills. */
export function ChoiceGroup<T extends string>({ legend, name, options, value, onChange }: ChoiceGroupProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2.5 font-medium text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <label
            key={option.value}
            className="rounded-lg border border-line-strong bg-surface px-4 py-2 text-[0.9375rem] text-body hover:bg-sunken has-checked:border-ink has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
