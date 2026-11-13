# Phone QA checklist (sprint E1)

One pass on each phone, from a new account to deleting it. Write ✅ or ❌ in
each phone's column, and a few words in Notes for anything odd (a screenshot
helps). About 45 minutes per phone.

**Where:** the staging site, https://staging--you-app-build.netlify.app,
which has its own database with test data only. Never test on the live site
with a real account.
**When:** after the next batch (B2, C2, C3, C4 and the AI-test fixes) is on
staging, so you test what testers will get.
**Phones:** an iPhone in Safari, installed to the Home Screen, and an Android
phone in Chrome, installed. If you can, one of them small (iPhone SE size).
**Content:** test words and pictures only, nothing personal (the account is
deleted at the end anyway). For pictures, use a photo of a plant, a cup, a
page of printed text.

| Phone | Model and system | Light or dark first |
|---|---|---|
| A | | |
| B | | |

## 1. Install and first open
| # | Check | A | B | Notes |
|---|---|---|---|---|
| 1.1 | Open the staging site; install it (iPhone: Share → Add to Home Screen; Android: menu → Install app). The icon and name look right | | | |
| 1.2 | Open it from the Home Screen: it opens full screen, with no browser bar | | | |
| 1.3 | The loading screen is calm and doesn't feel slow | | | |
| 1.4 | Nothing is hidden under the notch, the status bar or the home indicator | | | |

## 2. Sign up
| # | Check | A | B | Notes |
|---|---|---|---|---|
| 2.1 | Create an account with a test email you can open on the phone | | | |
| 2.2 | The confirmation email arrives (check spam), and its link opens YOU signed in, not an error page | | | |
| 2.3 | The welcome tour plays and matches what's really in the app; "See the welcome again" in Settings replays it | | | |
| 2.4 | Choose two or three first values; their meanings are clear | | | |

## 3. Pursuits and XP
| # | Check | A | B | Notes |
|---|---|---|---|---|
| 3.1 | PursYOUts: add a habit with quick add in under 30 seconds | | | |
| 3.2 | Check it in for today; the XP shows and the Pillar on YOU grows | | | |
| 3.3 | Undo the check-in and check in again: XP is given once, not twice | | | |
| 3.4 | Add a goal and finish it; the goal's XP (25) shows | | | |
| 3.5 | Home → Sow your week: pick an intention; tend it on Today; Harvest the week | | | |
| 3.6 | Tending a sown habit and checking it in on PursYOUts give XP once, not twice | | | |

## 4. YOUrnal, photos and memories
| # | Check | A | B | Notes |
|---|---|---|---|---|
| 4.1 | Write a journal entry with a mood | | | |
| 4.2 | Add a photo from the camera and one from the library; both show after saving and after reopening the app | | | |
| 4.3 | YOUrney: add a memory with a photo; then add a second memory straight away (it must not stick on "Saving…") | | | |
| 4.4 | The keyboard never covers the field you're typing in, or the Save button | | | |
| 4.5 | Edit and delete an entry and a memory | | | |

## 5. AI (consent on)
| # | Check | A | B | Notes |
|---|---|---|---|---|
| 5.1 | First AI request asks for consent clearly; say yes | | | |
| 5.2 | **Scan a page**: photograph a page of printed or handwritten test text into a journal entry; the words come out right | | | |
| 5.3 | Reflect on an entry; the reply is kind and makes no medical claims | | | |
| 5.4 | Read your season: the dates read as a full week (e.g. "9 – 15 Nov"), not one day | | | |
| 5.5 | With one dream entry, the dream card says it will look across them once there's a second dream; with two, it reads them | | | |
| 5.6 | A value's challenges: generate them, complete one; the card says which Pillar grew | | | |
| 5.7 | Ask YOU a question; it answers (may take ~30 seconds) | | | |

## 6. No signal
| # | Check | A | B | Notes |
|---|---|---|---|---|
| 6.1 | Turn on airplane mode with the app open: a calm banner says you're offline | | | |
| 6.2 | Screens you've opened before still show your things | | | |
| 6.3 | Write a journal entry and check in a habit offline; the banner counts the changes waiting | | | |
| 6.4 | Close the app fully and reopen it, still offline: your offline changes are still there | | | |
| 6.5 | AI and photo upload say kindly that they need a connection (no spinner forever) | | | |
| 6.6 | Turn airplane mode off: the changes sync, the banner goes, nothing is doubled | | | |

## 7. Light, dark and small
| # | Check | A | B | Notes |
|---|---|---|---|---|
| 7.1 | Switch the phone to the other mode (light/dark); go through Home, YOUrnal, PursYOUts, YOUrney and YOU: all text readable, nothing white-on-white | | | |
| 7.2 | On the small phone: no sideways scrolling, buttons easy to tap, nothing cut off | | | |
| 7.3 | Text set larger in the phone's settings: still readable, nothing overlapping | | | |

## 8. Your data, then goodbye
| # | Check | A | B | Notes |
|---|---|---|---|---|
| 8.1 | Settings → Your data → Download my data: the file downloads and opens (it holds your entries, pursuits, values and memories) | | | |
| 8.2 | Send feedback opens, sends, and thanks you (on staging it doesn't reach Notion; that's checked on live in E2) | | | |
| 8.3 | Sign out and back in: everything is there | | | |
| 8.4 | Settings → Your data → Delete my account (type DELETE): you land on the sign-in screen | | | |
| 8.5 | Signing in with the deleted account no longer works | | | |
| 8.6 | Remove the installed app from the Home Screen | | | |

## After both phones
- Tell Claude "phone QA done" with the ❌ rows. It checks the staging database
  for anything the deleted accounts left behind, and turns each ❌ into a fix.
- Bugs go to the contingency days (20–21 Nov); anything that's an idea, not
  a bug, goes to Build Notes for after the beta.
