import { Search, Angry, Frown, Meh, Smile, Laugh } from "lucide-react";

export function SearchInput({ placeholder = "Search", className = "", ...props }) {
  return (
    <div className={`flex items-center gap-2 bg-surface1 border border-borderC rounded-full px-4 py-2.5 ${className}`}>
      <Search size={16} strokeWidth={1.75} className="text-textMuted flex-none" />
      <input
        type="text"
        placeholder={placeholder}
        className="bg-transparent outline-none text-body text-textPrimary placeholder:text-textMuted flex-1 min-w-0"
        {...props}
      />
    </div>
  );
}

export function FloatingLabelField({ label, id, type = "text", className = "", ...props }) {
  const fieldId = id || label;
  return (
    <div className={`relative ${className}`}>
      <input
        type={type}
        placeholder=" "
        id={fieldId}
        className="peer w-full bg-surface1 border border-borderC rounded-sm px-3.5 pt-5 pb-2 text-body text-textPrimary outline-none focus:border-forestAccent"
        {...props}
      />
      <label
        htmlFor={fieldId}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body text-textMuted transition-all duration-150 pointer-events-none
          peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-caption peer-focus:text-forestAccent
          peer-[&:not(:placeholder-shown)]:top-3 peer-[&:not(:placeholder-shown)]:translate-y-0 peer-[&:not(:placeholder-shown)]:text-caption"
      >
        {label}
      </label>
    </div>
  );
}

const MOODS = [
  { key: "rough", Icon: Angry, label: "Rough" },
  { key: "low", Icon: Frown, label: "Low" },
  { key: "okay", Icon: Meh, label: "Okay" },
  { key: "good", Icon: Smile, label: "Good" },
  { key: "great", Icon: Laugh, label: "Great" }
];

export function MoodSelector({ value, onChange, className = "" }) {
  return (
    <div className={`flex justify-between gap-2 ${className}`}>
      {MOODS.map(({ key, Icon, label }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange?.(key)}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-sm border transition-colors duration-150 ${
              active ? "bg-forestAccent border-forestAccent text-surface2" : "border-borderC text-textMuted hover:bg-surface1"
            }`}
          >
            <Icon size={20} strokeWidth={1.75} />
            <span className="text-caption">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
