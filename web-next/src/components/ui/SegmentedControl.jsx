export function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex bg-surface3 rounded-full p-1 gap-1">
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 text-bodySm px-3 py-1.5 rounded-full transition-colors duration-200 ${
              active ? "bg-forestAccent text-surface2 font-medium" : "text-textSecondary"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
