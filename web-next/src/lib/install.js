// Putting YOU on a phone's home screen, without an app store.
//
// Chrome and Edge (mostly Android) offer a one-tap install: they fire
// `beforeinstallprompt` once, early, often before any screen mounts, so it's
// caught here at import time (main.jsx imports this first) and kept until
// the Intro asks for it. Safari has no such event; the Intro shows the
// Share → Add to Home Screen steps instead.
import { useEffect, useState } from "react";

let deferred = null;
const listeners = new Set();
const tell = () => listeners.forEach(fn => fn());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferred = e;
    tell();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    tell();
  });
}

// Already opened from the home screen, so there's nothing to install.
export function isInstalled() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

// "ios" | "android" | "desktop". iPads ask for the desktop site, so a Mac
// with a touch screen counts as iOS.
export function devicePlatform() {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

// Safari on an iPhone, where Share lives in the toolbar below the page.
// (Chrome, Firefox and Edge on iPhone add CriOS / FxiOS / EdgiOS; iPads
// keep Share at the top.)
export function isIPhoneSafari() {
  const ua = navigator.userAgent || "";
  return /iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

// { canPrompt, install } — install() resolves true if they said yes.
export function useInstallPrompt() {
  const [, bump] = useState(0);
  useEffect(() => {
    const fn = () => bump(n => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  async function install() {
    if (!deferred) return false;
    const e = deferred;
    deferred = null;
    tell();
    e.prompt();
    const { outcome } = await e.userChoice;
    return outcome === "accepted";
  }
  return { canPrompt: Boolean(deferred), install };
}
