// The values library the app works from: every Codex value (definitions,
// Element, Pillars, kin), joined with the fixed challenge sets the original
// 13 values still carry. Values without fixed challenges rely on AI-written
// ones ("Generate more challenges") until the curated sets are written.
import {
  MessageCircle, Flame, Eye, Shield, Target, Heart, Telescope, Moon, ShieldCheck, Paintbrush, Feather, Gem, Users,
  HandHeart, Bird, Waves, Sparkle, Droplets, Wind, Zap, Mountain, Smile, TreePine, HandHelping, Hourglass, Apple,
  Leaf, Anchor, Quote, BookOpen, Glasses, Scale, Laugh, DoorOpen, Fingerprint, Compass, Rainbow, Handshake, Infinity, Orbit
} from "lucide-react";
import { CODEX } from "./codex.generated";
import { ALL_VALUES_LIB } from "./values.const";

export const VALUE_ICONS = {
  // Water
  Empathy: Heart, Vulnerability: Feather, Rest: Moon, Compassion: HandHeart, Forgiveness: Bird,
  Acceptance: Waves, Intuition: Sparkle, Adaptability: Droplets,
  // Fire
  Courage: Flame, Discipline: Target, Creativity: Paintbrush, Freedom: Wind, Passion: Zap,
  Ambition: Mountain, Playfulness: Smile, Resilience: TreePine,
  // Earth
  Boundaries: Shield, Integrity: ShieldCheck, Family: Users, Responsibility: HandHelping, Patience: Hourglass,
  Health: Apple, Stewardship: Leaf, Commitment: Anchor,
  // Air
  Communication: MessageCircle, Curiosity: Telescope, Honesty: Quote, Learning: BookOpen, Clarity: Glasses,
  Fairness: Scale, Humour: Laugh, Openness: DoorOpen,
  // Ether
  Presence: Eye, Gratitude: Gem, Authenticity: Fingerprint, Meaning: Compass, Wonder: Rainbow,
  Trust: Handshake, Love: Infinity, Wisdom: Orbit
};

const LEGACY = Object.fromEntries(ALL_VALUES_LIB.map(v => [v.name, v]));

export const VALUE_LIBRARY = CODEX.map(c => ({
  ...c,
  tagline: c.essence,
  challenges: LEGACY[c.name]?.challenges || []
}));

const BY_NAME = Object.fromEntries(VALUE_LIBRARY.map(v => [v.name, v]));
const BY_SLUG = Object.fromEntries(VALUE_LIBRARY.map(v => [v.slug, v]));

export function getValueEntry(name) {
  return BY_NAME[name] || null;
}

export function valueNameForSlug(slug) {
  return BY_SLUG[slug]?.name || slug;
}
