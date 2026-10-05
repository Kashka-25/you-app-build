// YOUniversity · the Arcana. DRAFT wording (Oct 5), for Cassidy to edit.
//
// An Arcanum (Latin: a secret; to the alchemists, the hidden essence that
// heals or transforms) is an add-on a Seeker holds in their Library. Each
// one is described here; the database only records which exist, which are
// free, and who holds what (supabase/migrations/20261005100000_arcana.sql).
// A new Arcanum is a new entry here plus a row in `arcana`.
//
//   format     — which layout opens it (see FORMATS)
//   free       — must match arcana.is_free in the database
//   beginWith  — what the Seeker picks before a sitting: "value" | "pillar"
//   questionnaire — for the questionnaire format, which flow it runs
//   addsTo     — the parts of YOU it plugs into, in plain words
import { SunMoon, Feather } from "lucide-react";

export const FORMATS = {
  questionnaire: "Questionnaire",
  course: "Course",
  tool: "Tool"
};

export const ARCANA = [
  {
    slug: "light-and-shadow",
    name: "Light & Shadow",
    tagline: "Sit with one of your values, all of it.",
    icon: SunMoon,
    format: "questionnaire",
    questionnaire: "light_shadow",
    beginWith: "value",
    free: true,
    about:
      "Every value has a light, a shadow and a void: how it looks lived well, what happens when it goes too far, and how it feels when it's missing. Four quiet questions help you hold all three, and find what a balanced version could look like this season.",
    inside: ["4 questions, one at a time", "Stop anywhere and pick up where you left off", "Nothing is sent to an AI"],
    addsTo: [
      { area: "Values", line: "Explore any of your values from its card in the YOU tab." },
      { area: "Reflections", line: "Every sitting is kept in Explorations, just for you." }
    ]
  },
  {
    slug: "freeing-the-dream",
    name: "Freeing the Dream",
    tagline: "Find the dream waiting inside a Pillar of your life.",
    icon: Feather,
    format: "questionnaire",
    questionnaire: "freeing_dream",
    beginWith: "pillar",
    free: true,
    about:
      "Choose a Pillar and follow a dream from its first longing to a vision, through what weighs on it, to the smallest seed you could plant. Then decide what it becomes: planted, held as a seed, or released with thanks.",
    inside: ["4 stages: longing, vision, weight, seed", "End by planting, holding or releasing the dream", "Nothing is sent to an AI"],
    addsTo: [
      { area: "Pillars", line: "Free a dream from any Pillar in the YOU tab." },
      { area: "Pursue", line: "A planted dream goes straight into your dreams." },
      { area: "Reflections", line: "Every sitting is kept in Explorations, just for you." }
    ]
  }
];

export function getArcanum(slug) {
  return ARCANA.find(a => a.slug === slug) || null;
}

export function arcanumForQuestionnaire(questionnaire) {
  return ARCANA.find(a => a.questionnaire === questionnaire) || null;
}
