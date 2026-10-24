interface RadioChipsProps<T extends string> {
  name: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

/** A group of pill-shaped radio buttons. Keyboard and screen-reader friendly. */
export default function RadioChips<T extends string>({
  name,
  options,
  value,
  onChange,
}: RadioChipsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label key={option.value} className="relative">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="peer sr-only"
          />
          <span className="inline-flex cursor-pointer rounded-full border border-sand-300 bg-white px-3.5 py-1.5 text-sm text-ink-700 transition-colors hover:bg-cream-100 peer-checked:border-sage-600 peer-checked:bg-sage-50 peer-checked:font-medium peer-checked:text-sage-800 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sage-600">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  )
}