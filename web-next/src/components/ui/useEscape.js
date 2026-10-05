import { useEffect, useRef } from "react";

// "Exit on every screen": Escape closes whatever layer is on top — a modal,
// a sheet, the menu, a full-screen sky or map. Layers register while open;
// only the most recently opened one answers, so Escape on the world map
// (opened from The Story of You) closes the map, not both.
const stack = [];

function onKeyDown(e) {
  if (e.key !== "Escape" || !stack.length) return;
  const top = stack[stack.length - 1];
  e.preventDefault();
  top.current?.();
}

export function useEscape(active, onClose) {
  const handler = useRef(onClose);
  handler.current = onClose;

  useEffect(() => {
    if (!active) return;
    if (!stack.length) window.addEventListener("keydown", onKeyDown);
    stack.push(handler);
    return () => {
      const i = stack.lastIndexOf(handler);
      if (i !== -1) stack.splice(i, 1);
      if (!stack.length) window.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);
}
