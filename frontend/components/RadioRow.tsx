export default function RadioRow({
  name,
  value,
  checked,
  label,
  onChange,
}: {
  name: string
  value: string
  checked: boolean
  label: string
  onChange: () => void
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          checked
            ? 'border-indigo-500 bg-indigo-500'
            : 'border-zinc-600 group-hover:border-zinc-400'
        }`}
      >
        {checked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
      <span
        className={`text-sm transition-colors ${
          checked ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-300'
        }`}
      >
        {label}
      </span>
    </label>
  )
}
