// Kronk (Mastodon server) integration client.
//
// Kept in its own file so Kronk-specific logic never leaks into
// AppDataContext.jsx / AuthContext.jsx or gets scattered as inline fetches
// in screens (see BUILD-BACKLOG.md's "Kronk Integration Cross-Reference
// Notes" for the open questions this still depends on -- auth/account
// linking, token storage, RLS, etc. -- all unresolved as of this file
// existing). When the real CommYOUnity feed integration happens, its
// fetch functions belong here too, alongside fetchKronkEvents below.
//
// Nothing in this file makes a real network call yet. Every export is a
// stub returning mock data, clearly marked as the seam the Kronk
// integration session replaces.

const MOCK_KRONK_EVENTS = [
  {
    id: "k1",
    title: "Full moon circle",
    date: "2026-07-18T19:00:00",
    organizer: "Maya R.",
    kronkUrl: "https://kronk.example/@maya/events/full-moon-circle"
  },
  {
    id: "k2",
    title: "Community garden day",
    date: "2026-07-27T09:00:00",
    organizer: "Kronk Collective",
    kronkUrl: "https://kronk.example/@kronk-collective/events/garden-day"
  },
  {
    id: "k3",
    title: "Sunrise breathwork (drop-in)",
    date: "2026-08-03T06:30:00",
    organizer: "Kai T.",
    kronkUrl: "https://kronk.example/@kai/events/sunrise-breathwork"
  }
];

// Integration seam: replace this function body with a real Kronk API call
// (e.g. `fetch(`${KRONK_BASE_URL}/api/v1/events`)`), keeping the same
// return shape -- an array of { id, title, date, organizer, kronkUrl } --
// or update every caller that destructures it. Left async and Promise-
// returning on purpose so swapping in a real fetch doesn't change how
// callers use it.
export async function fetchKronkEvents() {
  return MOCK_KRONK_EVENTS;
}
