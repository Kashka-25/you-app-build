// One icon per Pillar, shared by every screen that shows Pillars (Pillars
// panel, Identity & Vision, Tree & Stars) so the taxonomy reads the same
// everywhere. Kept apart from app.const.js so that stays free of React deps.
import { Dumbbell, Heart, Brain, Sparkles, Users, Compass, Palette, Sprout } from "lucide-react";

export const PILLAR_ICONS = {
  Body: Dumbbell,
  Heart: Heart,
  Mind: Brain,
  Spirit: Sparkles,
  Connection: Users,
  Purpose: Compass,
  Play: Palette,
  "Home & Earth": Sprout
};
