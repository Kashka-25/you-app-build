// Shared motion presets — slow, elegant, intentional. Nothing snaps.
export const easeOut = [0.22, 1, 0.36, 1];

export const riseIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: easeOut }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: easeOut }
};

export const sheetIn = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 24 },
  transition: { duration: 0.35, ease: easeOut }
};
