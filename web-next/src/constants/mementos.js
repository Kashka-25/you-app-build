// Mementos: one grows with the flower that completes each hour of focus.
//
// Rules for this list (so nothing here is plagiarised or misquoted):
// - Public domain only: ancient texts, or writers whose work is long out of
//   copyright. No modern authors, and no modern translations of the
//   ancients (e.g. Rumi or Hafiz "versions"); old public-domain
//   translations, or plain renderings of the original, instead.
// - Always credited, with the work it comes from.
// - No famous misattributions (the internet is full of "Confucius" and
//   "Einstein" lines they never said). If a source can't be named, it
//   doesn't go in.
// Three kinds, all in one shuffle:
// - "classic": the greats, under the rules above.
// - "creator": Cassidy Dugan's own works, added as they're written.
// - "you": original lines written for the app, credited as "A message
//   directly from YOU". Anything we write ourselves, whatever inspired it,
//   is ours and goes here. Ideas are free to use; the wording must be our
//   own, never a close rewrite of someone else's line.
// Ids are stable: saved sessions point at them, so never renumber; add new
// ones at the end, whatever their kind.

export const MEMENTOS = [
  { id: 1, text: "Hold every hour in your grasp. Lay hold of today’s task, and you will not need to depend so much upon tomorrow’s.", author: "Seneca", source: "Letters to Lucilius, I" },
  { id: 2, text: "While we are postponing, life speeds by.", author: "Seneca", source: "Letters to Lucilius, I" },
  { id: 3, text: "As long as you live, keep learning how to live.", author: "Seneca", source: "Letters to Lucilius, LXXVI" },
  { id: 4, text: "No great thing is produced suddenly, since not even the bunch of grapes or the fig is.", author: "Epictetus", source: "Discourses, I.15" },
  { id: 5, text: "Such as are thy habitual thoughts, such also will be the character of thy mind; for the soul is dyed by the thoughts.", author: "Marcus Aurelius", source: "Meditations, V.16" },
  { id: 6, text: "No longer talk at all about the kind of man that a good man ought to be, but be such.", author: "Marcus Aurelius", source: "Meditations, X.16" },
  { id: 7, text: "Very little indeed is necessary for living a happy life.", author: "Marcus Aurelius", source: "Meditations, VII.67" },
  { id: 8, text: "We become just by doing just acts, temperate by doing temperate acts, brave by doing brave acts.", author: "Aristotle", source: "Nicomachean Ethics, II.1" },
  { id: 9, text: "The beginning is the most important part of any work.", author: "Plato", source: "The Republic, II" },
  { id: 10, text: "A journey of a thousand miles begins beneath one’s feet.", author: "Lao Tzu", source: "Tao Te Ching, 64" },
  { id: 11, text: "He who overcomes others is strong; he who overcomes himself is mighty.", author: "Lao Tzu", source: "Tao Te Ching, 33" },
  { id: 12, text: "Is virtue a thing remote? I wish to be virtuous, and lo! virtue is at hand.", author: "Confucius", source: "Analects, VII.29" },
  { id: 13, text: "To every thing there is a season, and a time to every purpose under the heaven.", author: "Ecclesiastes", source: "3:1" },
  { id: 14, text: "The creation of a thousand forests is in one acorn.", author: "Ralph Waldo Emerson", source: "History" },
  { id: 15, text: "Trust thyself: every heart vibrates to that iron string.", author: "Ralph Waldo Emerson", source: "Self-Reliance" },
  { id: 16, text: "If one advances confidently in the direction of his dreams, and endeavors to live the life which he has imagined, he will meet with a success unexpected in common hours.", author: "Henry David Thoreau", source: "Walden" },
  { id: 17, text: "I went to the woods because I wished to live deliberately.", author: "Henry David Thoreau", source: "Walden" },
  { id: 18, text: "I exist as I am, that is enough.", author: "Walt Whitman", source: "Song of Myself" },
  { id: 19, text: "Do I contradict myself? Very well then I contradict myself, (I am large, I contain multitudes.)", author: "Walt Whitman", source: "Song of Myself" },
  { id: 20, text: "‘Hope’ is the thing with feathers – that perches in the soul.", author: "Emily Dickinson", source: "‘Hope’ is the thing with feathers" },
  { id: 21, text: "Forever – is composed of Nows –", author: "Emily Dickinson", source: "Forever – is composed of Nows –" },
  { id: 22, text: "I dwell in Possibility –", author: "Emily Dickinson", source: "I dwell in Possibility –" },
  { id: 23, text: "Our doubts are traitors, and make us lose the good we oft might win, by fearing to attempt.", author: "William Shakespeare", source: "Measure for Measure, I.4" },
  { id: 24, text: "We know what we are, but know not what we may be.", author: "William Shakespeare", source: "Hamlet, IV.5" },
  { id: 25, text: "To see a World in a Grain of Sand, and a Heaven in a Wild Flower.", author: "William Blake", source: "Auguries of Innocence" },
  { id: 26, text: "Come forth into the light of things, let Nature be your teacher.", author: "William Wordsworth", source: "The Tables Turned" },
  { id: 27, text: "To strive, to seek, to find, and not to yield.", author: "Alfred, Lord Tennyson", source: "Ulysses" },
  { id: 28, text: "A thing of beauty is a joy for ever.", author: "John Keats", source: "Endymion" },
  { id: 29, text: "No coward soul is mine.", author: "Emily Brontë", source: "No coward soul is mine" },
  { id: 30, text: "If I have seen further it is by standing on the shoulders of Giants.", author: "Isaac Newton", source: "Letter to Robert Hooke, 1675" },
  { id: 31, text: "Work is love made visible.", author: "Kahlil Gibran", source: "The Prophet" },
  { id: 32, text: "The same stream of life that runs through my veins night and day runs through the world and dances in rhythmic measures.", author: "Rabindranath Tagore", source: "Gitanjali, 69" },

  // ── A message directly from YOU ──
  { id: 33, kind: "you", text: "You don’t have to feel ready. You only have to begin, and let the beginning teach you." },
  { id: 34, kind: "you", text: "An hour given with your whole attention is a quiet kind of love." },
  { id: 35, kind: "you", text: "Roots grow in the dark long before anything shows above the soil. Keep going." },
  { id: 36, kind: "you", text: "Nothing you tend with care is wasted, not even on the days it doesn’t seem to grow." },
  { id: 37, kind: "you", text: "You are not behind. You are exactly where your next step begins." },
  { id: 38, kind: "you", text: "Small and steady is still moving. Look how far small has carried you." },
  { id: 39, kind: "you", text: "Rest is part of the rhythm, not a break from it." },
  { id: 40, kind: "you", text: "The person you’re becoming is built from hours exactly like this one." },
  { id: 41, kind: "you", text: "Let it be imperfect. Let it be yours." },
  { id: 42, kind: "you", text: "Every bloom in this garden began as a seed you chose to plant." },
  { id: 43, kind: "you", text: "Your attention is the most precious thing you give. Today you gave it to what matters." },
  { id: 44, kind: "you", text: "Be as patient with yourself as you would be with anything you love that’s still growing." },

  // ── More from the greats (added Oct 4) ──
  { id: 45, text: "In the morning when thou risest unwillingly, let this thought be present: I am rising to the work of a human being.", author: "Marcus Aurelius", source: "Meditations, V.1" },
  { id: 46, text: "Look within. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig.", author: "Marcus Aurelius", source: "Meditations, VII.59" },
  { id: 47, text: "Everywhere means nowhere.", author: "Seneca", source: "Letters to Lucilius, II" },
  { id: 48, text: "There are more things likely to frighten us than there are to crush us; we suffer more often in imagination than in reality.", author: "Seneca", source: "Letters to Lucilius, XIII" },
  { id: 49, text: "Life is long, if you know how to use it.", author: "Seneca", source: "On the Shortness of Life, II" },
  { id: 50, text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus", source: "Discourses, III.23" },
  { id: 51, text: "There are things which are within our power, and there are things which are beyond our power.", author: "Epictetus", source: "Enchiridion, I" },
  { id: 52, text: "Character is destiny.", author: "Heraclitus", source: "Fragments" },
  { id: 53, text: "The highest excellence is like that of water.", author: "Lao Tzu", source: "Tao Te Ching, 8" },
  { id: 54, text: "All difficult things in the world are sure to arise from a previous state in which they were easy, and all great things from one in which they were small.", author: "Lao Tzu", source: "Tao Te Ching, 63" },
  { id: 55, text: "The superior man is modest in his speech, but exceeds in his actions.", author: "Confucius", source: "Analects, XIV" },
  { id: 56, text: "The commander of the forces of a large state may be carried off, but the will of even a common man cannot be taken from him.", author: "Confucius", source: "Analects, IX" },
  { id: 57, text: "All that we are is the result of what we have thought.", author: "The Dhammapada", source: "I.1" },
  { id: 58, text: "If one man conquer in battle a thousand times thousand men, and if another conquer himself, he is the greatest of conquerors.", author: "The Dhammapada", source: "VIII.103" },
  { id: 59, text: "Weeping may endure for a night, but joy cometh in the morning.", author: "Psalms", source: "30:5" },
  { id: 60, text: "Whatsoever thy hand findeth to do, do it with thy might.", author: "Ecclesiastes", source: "9:10" },
  { id: 61, text: "All shall be well, and all shall be well, and all manner of thing shall be well.", author: "Julian of Norwich", source: "Revelations of Divine Love" },
  { id: 62, text: "This above all: to thine own self be true.", author: "William Shakespeare", source: "Hamlet, I.3" },
  { id: 63, text: "The fault, dear Brutus, is not in our stars, but in ourselves.", author: "William Shakespeare", source: "Julius Caesar, I.2" },
  { id: 64, text: "Sweet are the uses of adversity.", author: "William Shakespeare", source: "As You Like It, II.1" },
  { id: 65, text: "Knowing is not enough; we must apply. Willing is not enough; we must do.", author: "Johann Wolfgang von Goethe", source: "Wilhelm Meister’s Journeyman Years" },
  { id: 66, text: "The busy bee has no time for sorrow.", author: "William Blake", source: "Proverbs of Hell" },
  { id: 67, text: "What is now proved was once only imagin’d.", author: "William Blake", source: "Proverbs of Hell" },
  { id: 68, text: "Though nothing can bring back the hour of splendour in the grass, of glory in the flower, we will grieve not, rather find strength in what remains behind.", author: "William Wordsworth", source: "Ode: Intimations of Immortality" },
  { id: 69, text: "I am certain of nothing but the holiness of the Heart’s affections and the truth of Imagination.", author: "John Keats", source: "Letter to Benjamin Bailey, 1817" },
  { id: 70, text: "Ah, but a man’s reach should exceed his grasp, or what’s a heaven for?", author: "Robert Browning", source: "Andrea del Sarto" },
  { id: 71, text: "’Tis better to have loved and lost than never to have loved at all.", author: "Alfred, Lord Tennyson", source: "In Memoriam A.H.H." },
  { id: 72, text: "Let us, then, be up and doing, with a heart for any fate.", author: "Henry Wadsworth Longfellow", source: "A Psalm of Life" },
  { id: 73, text: "Nothing can bring you peace but yourself.", author: "Ralph Waldo Emerson", source: "Self-Reliance" },
  { id: 74, text: "Insist on yourself; never imitate.", author: "Ralph Waldo Emerson", source: "Self-Reliance" },
  { id: 75, text: "Nothing great was ever achieved without enthusiasm.", author: "Ralph Waldo Emerson", source: "Circles" },
  { id: 76, text: "If you have built castles in the air, your work need not be lost; that is where they should be. Now put the foundations under them.", author: "Henry David Thoreau", source: "Walden" },
  { id: 77, text: "Simplify, simplify.", author: "Henry David Thoreau", source: "Walden" },
  { id: 78, text: "Live in each season as it passes; breathe the air, drink the drink, taste the fruit, and resign yourself to the influence of each.", author: "Henry David Thoreau", source: "Journal, 23 August 1853" },
  { id: 79, text: "Afoot and light-hearted I take to the open road.", author: "Walt Whitman", source: "Song of the Open Road" },
  { id: 80, text: "Re-examine all you have been told at school or church or in any book, dismiss whatever insults your own soul.", author: "Walt Whitman", source: "Preface to Leaves of Grass, 1855" },
  { id: 81, text: "Tell all the truth but tell it slant –", author: "Emily Dickinson", source: "Tell all the truth but tell it slant –" },
  { id: 82, text: "The Brain – is wider than the Sky –", author: "Emily Dickinson", source: "The Brain – is wider than the Sky –" },
  { id: 83, text: "Not knowing when the Dawn will come, I open every Door.", author: "Emily Dickinson", source: "Not knowing when the Dawn will come" },
  { id: 84, text: "I am no bird; and no net ensnares me: I am a free human being with an independent will.", author: "Charlotte Brontë", source: "Jane Eyre" },
  { id: 85, text: "The growing good of the world is partly dependent on unhistoric acts.", author: "George Eliot", source: "Middlemarch" },
  { id: 86, text: "Does the road wind up-hill all the way? Yes, to the very end.", author: "Christina Rossetti", source: "Up-Hill" },
  { id: 87, text: "There lives the dearest freshness deep down things.", author: "Gerard Manley Hopkins", source: "God’s Grandeur" },
  { id: 88, text: "To travel hopefully is a better thing than to arrive, and the true success is to labour.", author: "Robert Louis Stevenson", source: "El Dorado" },
  { id: 89, text: "Your pain is the breaking of the shell that encloses your understanding.", author: "Kahlil Gibran", source: "The Prophet" },
  { id: 90, text: "Let life be beautiful like summer flowers and death like autumn leaves.", author: "Rabindranath Tagore", source: "Stray Birds, 82" },

  // ── More messages directly from YOU (added Oct 4) ──
  { id: 91, kind: "you", text: "You came back to it. That’s the whole practice." },
  { id: 92, kind: "you", text: "A distracted hour still counts. Every returning is a small act of devotion." },
  { id: 93, kind: "you", text: "You can’t rush a bloom, and you were never meant to." },
  { id: 94, kind: "you", text: "What you do quietly, again and again, becomes who you are." },
  { id: 95, kind: "you", text: "Some seasons are for blooming, some for roots. Both are growing." },
  { id: 96, kind: "you", text: "You don’t need to finish everything. You need to keep tending what matters." },
  { id: 97, kind: "you", text: "The work you love is a way of loving yourself." },
  { id: 98, kind: "you", text: "Your focus is a vote for the life you want." },
  { id: 99, kind: "you", text: "Be proud of the hours no one saw." },
  { id: 100, kind: "you", text: "A seed doesn’t doubt the sun. Let yourself trust the time you’re giving." },
  { id: 101, kind: "you", text: "You are allowed to grow slowly." },
  { id: 102, kind: "you", text: "Discipline can be gentle. It can sound like ‘let’s try again.’" },
  { id: 103, kind: "you", text: "This hour was a gift you gave your future self." },
  { id: 104, kind: "you", text: "The garden doesn’t ask if you were perfect. It only shows that you came." },
  { id: 105, kind: "you", text: "Your values are only words until hours like this one give them roots." },
  { id: 106, kind: "you", text: "Keep a little wonder in the work. It’s what keeps the work alive." },
  { id: 107, kind: "you", text: "You don’t have to carry the whole dream today. Just this part of it." },
  { id: 108, kind: "you", text: "Stillness is not standing still. It’s where the roots go deep." },
  { id: 109, kind: "you", text: "Every time you choose to begin again, you get a little braver." },
  { id: 110, kind: "you", text: "What grows slowly, lasts." },
  { id: 111, kind: "you", text: "The hard days you showed up for are the ones that made you." },
  { id: 112, kind: "you", text: "You are tending more than a task. You are tending a self." },
  { id: 113, kind: "you", text: "Joy counts as progress too." },
  { id: 114, kind: "you", text: "There’s no wrong pace for a life that’s truly yours." },
  { id: 115, kind: "you", text: "Let today’s effort be enough for today." },
  { id: 116, kind: "you", text: "Your light didn’t need permission to grow. Neither do you." },
  { id: 117, kind: "you", text: "Look back for a moment. You’ve come further than you think." },
  { id: 118, kind: "you", text: "The world needs what you’re quietly making." },
  { id: 119, kind: "you", text: "Breathe. You’re allowed to enjoy the becoming." },
  { id: 120, kind: "you", text: "One hour, given wholly, can change the shape of a day." },
  { id: 121, kind: "you", text: "The things you keep returning to are telling you who you are." },
  { id: 122, kind: "you", text: "Even the tallest tree was once a seed that didn’t give up on the dark." },
  { id: 123, kind: "you", text: "Be kind to the version of you who is still learning." },
  { id: 124, kind: "you", text: "You are the gardener and the garden. Tend both." },
  { id: 125, kind: "you", text: "Thank you for showing up for yourself today." },

  // ── Great minds of music, art and the mind (added Oct 4) ──
  { id: 126, text: "I will seize fate by the throat; it shall certainly not bend and crush me completely.", author: "Ludwig van Beethoven", source: "Letter to Franz Wegeler, 1801" },
  { id: 127, text: "If we wait for the mood, without endeavouring to meet it half-way, we easily become indolent and apathetic.", author: "Pyotr Ilyich Tchaikovsky", source: "Letter to Nadezhda von Meck, 1878" },
  { id: 128, text: "The thoughts which are expressed to me by music that I love are not too indefinite to be put into words, but on the contrary, too definite.", author: "Felix Mendelssohn", source: "Letter to Marc-André Souchay, 1842" },
  { id: 129, text: "Great things are not done by impulse, but by a series of small things brought together.", author: "Vincent van Gogh", source: "Letter to Theo van Gogh, 1882" },
  { id: 130, text: "If you hear a voice within you say you cannot paint, then by all means paint, and that voice will be silenced.", author: "Vincent van Gogh", source: "Letter to Theo van Gogh, 1883" },
  { id: 131, text: "Iron rusts from disuse; stagnant water loses its purity and in cold weather becomes frozen; even so does inaction sap the vigour of the mind.", author: "Leonardo da Vinci", source: "Notebooks" },
  { id: 132, text: "Art does not reproduce the visible; rather, it makes visible.", author: "Paul Klee", source: "Creative Confession, 1920" },
  { id: 133, text: "Colour is the keyboard, the eyes are the hammers, the soul is the piano with many strings.", author: "Wassily Kandinsky", source: "Concerning the Spiritual in Art" },
  { id: 134, text: "My experience is what I agree to attend to.", author: "William James", source: "The Principles of Psychology" },
  { id: 135, text: "Believe that life is worth living, and your belief will help create the fact.", author: "William James", source: "Is Life Worth Living?" },
  { id: 136, text: "All the unhappiness of men arises from one single fact, that they cannot stay quietly in their own chamber.", author: "Blaise Pascal", source: "Pensées, 139" },
  { id: 137, text: "The greatest thing in the world is to know how to belong to oneself.", author: "Michel de Montaigne", source: "Essays, Of Solitude" },
  { id: 138, text: "All things excellent are as difficult as they are rare.", author: "Baruch Spinoza", source: "Ethics, V" },
  { id: 139, text: "Life can only be understood backwards; but it must be lived forwards.", author: "Søren Kierkegaard", source: "Journals, 1843" },
  { id: 140, text: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche", source: "Twilight of the Idols" },
  { id: 141, text: "One must still have chaos in oneself to be able to give birth to a dancing star.", author: "Friedrich Nietzsche", source: "Thus Spoke Zarathustra, Prologue" },
  { id: 142, text: "The unexamined life is not worth living.", author: "Socrates", source: "in Plato’s Apology" },
  { id: 143, text: "The mind is not a vessel that needs filling, but wood that needs kindling.", author: "Plutarch", source: "On Listening" },
  { id: 144, text: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde", source: "Lady Windermere’s Fan" },
  { id: 145, text: "Lock up your libraries if you like; but there is no gate, no lock, no bolt that you can set upon the freedom of my mind.", author: "Virginia Woolf", source: "A Room of One’s Own" },
  { id: 146, text: "Although the world is full of suffering, it is full also of the overcoming of it.", author: "Helen Keller", source: "Optimism" },
  { id: 147, text: "If there is no struggle, there is no progress.", author: "Frederick Douglass", source: "West India Emancipation speech, 1857" },

  // ── A message directly from YOU (to 50) ──
  { id: 148, kind: "you", text: "You are not your productivity. You are the one who chose to show up." },
  { id: 149, kind: "you", text: "Today’s small yes is tomorrow’s deep root." },
  { id: 150, kind: "you", text: "Close this hour gently. You did something real." },

  // ── Cassidy Dugan ──
  // Cassidy's own works. Add more as they're written, at the next free id.
  { id: 151, kind: "creator", text: "I’ll keep on dreaming while I’m still breathing. I’ve got one life, I choose to live it my way.", author: "Cassidy Dugan", source: "Forest of Dreams" },
  { id: 152, kind: "creator", text: "Come Spring, you’ll see your flowers will bloom, if you water your garden with attention and truth.", author: "Cassidy Dugan", source: "Forest of Dreams" },
  { id: 153, kind: "creator", text: "If you need to be alone then darling, honour that prayer.", author: "Cassidy Dugan", source: "Forest of Dreams" },
  { id: 154, kind: "creator", text: "You may be a little bit damaged for an array of different reasons. But you’re not broken, you’re just a flower growing through the seasons.", author: "Cassidy Dugan", source: "Seasonal Flower" },
  { id: 155, kind: "creator", text: "All this time I’ve been chasing stars, I’ve been ignoring the brightest star of all: the one in my heart.", author: "Cassidy Dugan", source: "North Star" },
  { id: 156, kind: "creator", text: "With every storm comes new hope, and every fire brings new growth.", author: "Cassidy Dugan", source: "Saffron Nights" },
  { id: 157, kind: "creator", text: "I believe this life is a canvas waiting to be painted with our dreams. We just have to set them free, stroke by stroke.", author: "Cassidy Dugan", source: "Life Is A Canvas" },
  { id: 158, kind: "creator", text: "The deeper you dive, the less the waves will affect you.", author: "Cassidy Dugan", source: "Deep Dive" },
  { id: 159, kind: "creator", text: "The dark you sometimes find yourself swimming through only accentuates your light that much more. So keep swimming. I see you.", author: "Cassidy Dugan", source: "Swimming Star" },
  { id: 160, kind: "creator", text: "Life is just a story that we all write. It’s the people along the way that bring our stories to life.", author: "Cassidy Dugan", source: "Waiting For A Ride" },
  { id: 161, kind: "creator", text: "It’s not my time to give up, it’s my chance to start again.", author: "Cassidy Dugan", source: "Tired of Being Tired" },
  { id: 162, kind: "creator", text: "When our emotions arise, treat them as your compass, guiding us in the direction of where our heart lives.", author: "Cassidy Dugan", source: "My Living YOUlogy" },
  { id: 163, kind: "creator", text: "A spirit that keeps breathing, with a heart that keeps beating, and a mind that keeps thinking. What a gift it is to be an alchemist that’s still seeking.", author: "Cassidy Dugan", source: "Red Race Car" },
  { id: 164, kind: "creator", text: "We are the stars and the abyss all around. If we don’t experience the dark nebula then we will never be able to embrace and bathe in the breathtaking galaxy that we are.", author: "Cassidy Dugan" },
  { id: 165, kind: "creator", text: "The depths I swim amount to the treasure I surface with… a wealth I choose to share.", author: "Cassidy Dugan" }
];

// How a memento is credited underneath its line.
export function creditOf(m) {
  if (m.kind === "you") return { author: "A message directly from YOU", source: null };
  return { author: m.author, source: m.source || null };
}

export function getMemento(id) {
  return MEMENTOS.find(m => m.id === id) || null;
}

// The memento for the Seeker's n-th hour of focus (1-based). Each Seeker
// walks the whole list in their own shuffled order before any repeats.
export function mementoForHour(hour, seed = "") {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const order = MEMENTOS.map((m, i) => ({ id: m.id, k: Math.imul(h ^ (i + 1), 2654435761) >>> 0 })).sort((a, b) => a.k - b.k);
  return order[(hour - 1) % order.length].id;
}
