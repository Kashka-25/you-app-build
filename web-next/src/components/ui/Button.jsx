import { motion } from "framer-motion";

const SIZES = {
  md: "text-body px-5 py-3 rounded-sm",
  sm: "text-bodySm px-4 py-2 rounded-sm"
};

const VARIANTS = {
  primary: "bg-forestAccent text-surface2 shadow-card hover:bg-forest",
  secondary: "border border-borderC bg-surface1 text-textPrimary hover:bg-surface3",
  ghost: "text-textSecondary hover:bg-surface1 hover:text-textPrimary"
};

export function Button({ variant = "primary", size = "md", icon: Icon, children, className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={18} strokeWidth={1.75} />}
      {children}
    </button>
  );
}

export function FloatingButton({ icon: Icon, className = "", ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.15 }}
      className={`w-14 h-14 rounded-full bg-forestAccent text-surface2 shadow-card flex items-center justify-center hover:bg-forest transition-colors duration-150 ${className}`}
      {...props}
    >
      <Icon size={22} strokeWidth={2} />
    </motion.button>
  );
}
