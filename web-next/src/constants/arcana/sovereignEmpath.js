// The Sovereign Empath — course content. DRAFT (Oct 5), written to YOU's
// voice for Cassidy to reshape. Credited "A message directly from YOU".
//
// A course is: an opening check-in, stages (each a lesson, a practice and a
// challenge), and a closing check-in. Every part is a list of steps the
// course player knows how to show (see components/course/steps):
//   read · reflect · choose · scenario · scale · breathe · list · value · challenge
// `rest` is how many days to rest after finishing a part before the next
// one opens (at least 1; deeper work gets 2). Answers are kept by `key`.
//
// Honesty: "empath" here describes someone who feels others deeply. No
// claims about absorbing energy; nothing diagnostic.
import { Eye, Shield, HandHeart, Moon, Hand, Wind, Crown } from "lucide-react";

const FEELINGS = [
  "Anxious", "Hurt", "Angry", "Sad", "Overwhelmed", "Guilty",
  "Ashamed", "Lonely", "Tired", "Unsettled", "Numb", "Tender"
];

export const CHECK_IN = {
  scale: ["Rarely", "Sometimes", "Often", "Usually", "Almost always"],
  statements: [
    { key: "clarity", text: "I can tell what I'm feeling, even when someone near me is upset." },
    { key: "separate", text: "I can tell my feelings apart from other people's." },
    { key: "no", text: "I can say no without long explanations or guilt that lingers." },
    { key: "ask", text: "I ask what kind of support someone wants before I step in." },
    { key: "allow", text: "I can let others have their feelings without needing to fix them." },
    { key: "trust", text: "I trust my own sense of what's right for me." },
    { key: "whole", text: "I'm at peace with the parts of me that aren't always \"nice\"." },
    { key: "return", text: "After time with others, I can find my way back to myself." },
    { key: "mutual", text: "The care in my closest relationships flows both ways." }
  ]
};

const checkInSteps = closing => [
  closing
    ? {
        type: "read", title: "One last look",
        body: "The same nine statements you met at the very beginning. Answer as you are now, not as you think you should be. There are no right answers, only honest ones."
      }
    : {
        type: "read", title: "Where you are now",
        body: "Nine short statements about how you feel and relate. Answer as you are today, not as you'd like to be.\n\nThis isn't a test or a diagnosis. It's a starting point you'll come back to at the end, to see what changed in your own words."
      },
  { type: "scale", key: "scores", prompt: "How true is each of these for you?", statements: CHECK_IN.statements, scale: CHECK_IN.scale },
  closing
    ? { type: "reflect", key: "note", label: "In my own words", prompt: "What feels different now, if anything?", hint: "Optional. A word or a sentence is enough." }
    : { type: "reflect", key: "note", label: "What I'm hoping for", prompt: "What are you hoping this course might help with?", hint: "Optional. A word or a sentence is enough." }
];

const valueStep = { type: "value", key: "values", prompt: "Which values did this honour?", hint: "Living it grows the values you hold. The growth is shared between the ones you choose." };

export const TOOLS = {
  "emotional-mirror": {
    name: "Emotional Mirror",
    icon: Eye,
    about: "Five questions to see what you're actually feeling, and what's yours to tend.",
    steps: [
      { type: "read", title: "Take a breath", body: "Bring to mind something that's stirred you, today or recently. Small is fine. Go slowly." },
      { type: "choose", key: "feeling", label: "Feeling", prompt: "What am I feeling?", hint: "Choose any that fit, or add your own.", options: FEELINGS, multi: true, other: true },
      { type: "reflect", key: "happened", label: "What happened", prompt: "What actually happened?", hint: "Just the facts, as a camera would see them." },
      { type: "reflect", key: "story", label: "The story", prompt: "What am I telling myself about it?", hint: "The meaning I've added. It may or may not be true." },
      { type: "reflect", key: "need", label: "What I need", prompt: "What do I need right now?" },
      { type: "reflect", key: "control", label: "Within my control", prompt: "What here is within my control?" }
    ]
  },
  "boundary-builder": {
    name: "Boundary Builder",
    icon: Shield,
    about: "Turn a situation that doesn't feel right into a clear, kind boundary you can actually say.",
    steps: [
      { type: "read", title: "One situation", body: "Bring to mind one situation where something doesn't feel right. If you're new to this, choose something small. Small is perfect for practising." },
      { type: "reflect", key: "situation", label: "The situation", prompt: "What's happening?" },
      { type: "reflect", key: "need", label: "What I need", prompt: "What do I need here?" },
      { type: "reflect", key: "ok", label: "Comfortable with", prompt: "What am I comfortable with?" },
      { type: "reflect", key: "notok", label: "Not comfortable with", prompt: "What am I not comfortable with?" },
      { type: "reflect", key: "boundary", label: "My boundary", prompt: "What boundary do I want?", hint: "Try starting with \"I will…\" or \"I won't…\". A boundary is about what you'll do, not what they must do." },
      { type: "reflect", key: "words", label: "How I'll say it", prompt: "How could I say it?", hint: "Short and kind. No need to over-explain.", placeholder: "I can't talk tonight, but I could call on Saturday." },
      { type: "reflect", key: "action", label: "If it isn't respected", prompt: "If it isn't respected, what will I do?" }
    ]
  },
  "is-this-mine": {
    name: "Is This Mine?",
    icon: HandHeart,
    about: "When someone's struggle pulls at you: sort what's yours from what's theirs, and support without taking over.",
    steps: [
      { type: "read", title: "Someone you care about", body: "Bring to mind someone whose struggle is pulling at you right now." },
      { type: "reflect", key: "situation", label: "Their situation", prompt: "What's happening for them?" },
      { type: "choose", key: "asked", label: "Asked to help?", prompt: "Have I been asked to help?", options: ["Yes, clearly", "Not exactly", "No"] },
      { type: "reflect", key: "wanted", label: "Support they want", prompt: "What kind of support do they actually want?", hint: "If you're not sure, that's your answer: you could ask them." },
      { type: "reflect", key: "mine", label: "Mine", prompt: "What belongs to me here?" },
      { type: "reflect", key: "theirs", label: "Theirs", prompt: "What belongs to them?" },
      { type: "reflect", key: "support", label: "How I'll support", prompt: "How can I support without taking over?" }
    ]
  },
  "shadow-mirror": {
    name: "Shadow Mirror",
    icon: Moon,
    about: "Meet a part of yourself you may have put away, through the people who stir you most.",
    steps: [
      { type: "read", title: "Gentle work", body: "This is reflection, not diagnosis. Go slowly, and stop whenever you like. Nothing here is a verdict on who you are." },
      { type: "reflect", key: "trigger", label: "What stirs me", prompt: "What quality in other people triggers a strong reaction in you?", hint: "Someone who seems \"too much\", \"selfish\", \"bossy\", \"lazy\"…" },
      { type: "reflect", key: "reveal", label: "What it might reveal", prompt: "What might this reveal about a part of yourself?", hint: "Is it something you were taught not to be?", support: true },
      { type: "reflect", key: "healthy", label: "Healthy expression", prompt: "What would a healthy expression of this quality look like in you?" },
      { type: "reflect", key: "welcome", label: "A small welcome", prompt: "One small way you could welcome it this week?" }
    ]
  },
  "saying-no": {
    name: "Saying No",
    icon: Hand,
    about: "Three everyday moments to practise a kind, clear no, and see what each choice holds.",
    steps: [
      { type: "read", title: "Three moments", body: "For each one, choose what you'd most likely do. Then see what each choice holds. There's no wrong answer here, only practice." },
      {
        type: "scenario", key: "late", label: "Late-night call",
        situation: "A friend messages late at night. They need to talk, now. You're exhausted and have an early start.",
        options: [
          { text: "Call them anyway and push through.", reflection: "Kind in the moment, but it teaches you both that your limits don't count. Tomorrow you'll have less to give anyone." },
          { text: "Leave the message unread.", reflection: "Understandable, but silence can leave them anxious and you guilty. A short reply is kinder to you both." },
          { text: "\"I'm sorry it's so hard. I'm wiped out tonight. Can we talk tomorrow at lunch?\"", reflection: "Care and a limit in the same breath. You've offered real support at a time you can actually give it." }
        ]
      },
      {
        type: "scenario", key: "work", label: "Covering again",
        situation: "A colleague asks you to cover their task again. You're already stretched.",
        options: [
          { text: "Say yes and stay late.", reflection: "It keeps the peace today and quietly costs you. The pattern usually grows." },
          { text: "Say yes, then feel resentful all week.", reflection: "Resentment is often a no that wasn't said. It's information, not a flaw." },
          { text: "\"I can't take that on this week.\"", reflection: "Clear and short. No apology needed for having limits." }
        ]
      },
      {
        type: "scenario", key: "family", label: "A family event",
        situation: "Someone in your family is upset that you won't come to an event.",
        options: [
          { text: "Change your plans so they won't be hurt.", reflection: "Their feeling decided for you. Sometimes that's a choice worth making; just make sure it's a choice." },
          { text: "Explain every reason until they agree.", reflection: "Needing them to agree can keep you explaining forever. Your no can stand without their approval." },
          { text: "\"I know you're disappointed. I still won't be coming, and I love you.\"", reflection: "You let their feeling exist without letting it decide for you." }
        ]
      },
      { type: "reflect", key: "waiting", label: "A no that's waiting", prompt: "Where in your life is a no waiting to be said?" }
    ]
  },
  "ninety-second-centre": {
    name: "The 90-Second Centre",
    icon: Wind,
    about: "A short way back to yourself when you're pulled off centre: stop, breathe, orient, notice, name, discern, choose.",
    steps: [
      { type: "read", title: "Stop.", body: "Whatever you're doing, pause. You don't have to respond yet." },
      { type: "breathe", title: "Breathe.", rounds: 3, pattern: [4, 2, 6] },
      { type: "read", title: "Orient.", body: "Look around. Name three things you can see. Feel your feet on the ground. You are here, now." },
      { type: "choose", key: "body", label: "Felt in", prompt: "Notice. Where do you feel it in your body?", options: ["Chest", "Throat", "Stomach", "Shoulders", "Jaw", "Head", "All over", "Nowhere yet"], multi: true },
      { type: "choose", key: "feeling", label: "Feeling", prompt: "Name. What are you feeling?", options: FEELINGS, multi: true, other: true },
      { type: "choose", key: "whose", label: "Whose", prompt: "Discern. Is this mine, theirs, or both?", options: ["Mine", "Theirs", "Both", "I'm not sure"] },
      { type: "reflect", key: "choice", label: "My choice", prompt: "Choose. What response aligns with who you want to be?" }
    ]
  },
  "sovereignty-code": {
    name: "My Sovereignty Code",
    icon: Crown,
    about: "Your own commitments for how you care, connect and stay centred. Words to return to.",
    showLatest: "commitments",
    steps: [
      { type: "read", title: "Your Sovereignty Code", body: "Write up to five commitments to yourself, in your own words. Tap an example to start from it, then make it yours." },
      {
        type: "list", key: "commitments", label: "My commitments", prompt: "I commit to…", count: 5,
        examples: [
          "I don't abandon myself to keep someone else comfortable.",
          "I can care without taking responsibility for another person's feelings.",
          "I'm allowed to change my mind.",
          "I can say no without making anyone wrong.",
          "I choose relationships where care flows both ways."
        ]
      },
      { type: "reflect", key: "keep", label: "Where I'll keep them", prompt: "Where will you keep these close?", hint: "Optional. Your lock screen, a note by your bed, the mirror…" }
    ]
  }
};

export const STAGES = [
  {
    id: "mirror", short: "Notice what you feel.", numeral: "I", name: "The Mirror", question: "What am I actually feeling?",
    lesson: {
      rest: 1,
      steps: [
        { type: "read", title: "Feeling deeply is not the problem", body: "Many people who call themselves empaths notice other people's moods quickly and feel them strongly. A tense room, a friend's quiet sigh, and something in you shifts.\n\nThat sensitivity is a gift. The difficulty begins when what you notice in others becomes the only thing you can hear." },
        { type: "read", title: "Whose feeling is this?", body: "When someone near you is upset, it's natural to feel unsettled too. That feeling is real, and it's yours: it's your response to them.\n\n\"They're angry\" and \"I feel anxious when they're angry\" are two different things. Only one of them is yours to tend." },
        { type: "read", title: "What happened, and the story", body: "\"She didn't reply\" is what happened. \"She's upset with me\" is a story about what happened.\n\nStories aren't wrong, but old fears often write them. Separating the two gives you room to choose." },
        { type: "reflect", key: "noticed", label: "A moment I noticed", prompt: "Think of a recent moment when someone else's mood changed yours. What happened?", hint: "Optional." },
        { type: "read", quote: "Feel deeply. Then ask, gently: what is mine here?" }
      ]
    },
    practice: { tool: "emotional-mirror", rest: 1 },
    challenge: {
      rest: 1, pts: 10, title: "Notice the hand-off",
      body: "Once a day, notice a moment when you try to manage someone else's mood: smoothing, soothing, fixing, going quiet.\n\nYou don't need to change it. Just notice, and name it to yourself: \"I'm managing their feelings.\"",
      reflect: { key: "noticed", label: "What I noticed", prompt: "What did you notice?" }
    }
  },
  {
    id: "boundary", short: "Protect what matters.", numeral: "II", name: "The Boundary", question: "Compassion does not require access.",
    lesson: {
      rest: 1,
      steps: [
        { type: "read", title: "A line around what's yours", body: "A boundary isn't a wall, and it isn't a punishment. It's a clear line around your time, your energy, your body, your attention and your choices.\n\nIt lets you stay kind without giving yourself away." },
        { type: "read", title: "Many kinds of boundaries", body: "Physical: your body and your space.\nEmotional: whose feelings you hold.\nTime: how long, and how often.\nDigital: when you answer, and what you share.\nConversational: what you're willing to talk about.\nRelational: who gets close to the most tender parts of you." },
        { type: "choose", key: "hardest", label: "Hardest for me", prompt: "Which kind feels hardest for you right now?", options: ["Physical", "Emotional", "Time", "Digital", "Conversational", "Relational"] },
        { type: "read", title: "Understanding isn't owing", body: "Understanding why someone wants something doesn't mean you owe it to them.\n\nYou can say, \"I can see why this matters to you,\" and still say, \"and I can't do it.\"" },
        { type: "read", quote: "Compassion does not require access." }
      ]
    },
    practice: { tool: "boundary-builder", rest: 1 },
    challenge: {
      rest: 1, pts: 15, title: "One small boundary",
      body: "Choose something low-stakes: leaving a call on time, not replying after nine, asking for a moment before you answer.\n\nPractise it once. Notice what happens in you before, during and after.",
      reflect: { key: "how", label: "How it went", prompt: "How did it go?" }
    }
  },
  {
    id: "rescuer", short: "Release what isn't yours.", numeral: "III", name: "The Rescuer", question: "Their pain is not automatically mine to carry.",
    lesson: {
      rest: 1,
      steps: [
        { type: "read", title: "The pull to rescue", body: "When you feel others deeply, their pain can feel urgent, as though it's yours to end. So you jump in: fixing, advising, giving, smoothing.\n\nIt comes from love. But rescuing can quietly take something from both of you." },
        { type: "read", title: "What rescuing costs", body: "It can leave you exhausted, and sometimes resentful. And without a word, it can tell the other person you don't believe they can find their own way.\n\nCare that trusts someone's strength is often the deeper care." },
        {
          type: "choose", key: "signs", label: "I recognise", prompt: "Which of these do you recognise in yourself?", multi: true,
          options: [
            "I give advice no one asked for",
            "I feel guilty when someone I love is struggling",
            "I feel most valued when I'm needed",
            "I do more than my share so others won't be upset",
            "It's hard to watch someone struggle without stepping in",
            "I agree before I've checked in with myself"
          ]
        },
        { type: "read", title: "Support without taking over", body: "Before you help, you can simply ask:\n\n\"Would you like me to listen, help you think it through, or help find a solution?\"\n\nIt honours them, and it tells you exactly what's being asked of you." }
      ]
    },
    practice: { tool: "is-this-mine", rest: 1 },
    challenge: {
      rest: 1, pts: 15, title: "Ask before you help",
      body: "The next time someone shares a problem, before you offer anything, ask: \"Would you like me to listen, help you think it through, or help you find a solution?\"\n\nThen give them what they ask for, and only that.",
      reflect: { key: "how", label: "What happened", prompt: "What happened when you asked?" }
    }
  },
  {
    id: "shadow", short: "Meet what you hide.", numeral: "IV", name: "The Shadow", question: "What have I hidden to stay acceptable?",
    lesson: {
      rest: 1,
      steps: [
        { type: "read", title: "The parts we put away", body: "Growing up, most of us learn which parts of ourselves are welcome. If being easy, kind and accommodating kept you safe or loved, other parts may have been quietly put away: anger, ambition, desire, the wish to be alone, the word no." },
        { type: "read", title: "What the shadow holds", body: "The psychologist Carl Jung called these hidden parts the shadow. They don't disappear; they wait.\n\nOften they show up as a strong reaction to someone who openly lives what we've hidden." },
        { type: "read", title: "An invitation, not a diagnosis", body: "This isn't about finding something wrong with you. It's an invitation to meet parts of yourself with curiosity, and to ask what a healthy expression of them might look like." },
        { type: "choose", key: "hidden", label: "Hardest to allow", prompt: "Which of these feel hardest to let yourself have?", multi: true, options: ["Anger", "Assertiveness", "Ambition", "Desire", "Jealousy", "Solitude", "Power", "Rest", "Saying no", "Being selfish sometimes"] },
        { type: "read", quote: "What I hide doesn't leave. It waits to be welcomed home." }
      ]
    },
    practice: { tool: "shadow-mirror", rest: 2 },
    challenge: {
      rest: 1, pts: 15, title: "Twenty minutes, just for you",
      body: "Take twenty minutes of intentional solitude this week. No helping, no messages, no being useful.\n\nNotice what comes up when no one needs anything from you.",
      reflect: { key: "how", label: "What came up", prompt: "What came up?" }
    }
  },
  {
    id: "no", short: "Choose consciously.", numeral: "V", name: "The No", question: "No is a complete choice.",
    lesson: {
      rest: 1,
      steps: [
        { type: "read", title: "Why no feels so hard", body: "For many sensitive people, saying no feels like causing harm. You can sense someone's disappointment before they've even felt it.\n\nSo yes comes out, and you pay for it later." },
        { type: "read", title: "Disappointment isn't damage", body: "When you say no, someone may feel disappointed. That's allowed.\n\nTheir disappointment is a feeling they can hold. It isn't proof you did something wrong." },
        { type: "read", title: "A kind no is short", body: "Over-explaining often comes from needing the other person to agree that your no is okay.\n\nA clear no can be warm and brief: \"Thank you for thinking of me. I can't this time.\"" },
        { type: "choose", key: "pattern", label: "My pattern", prompt: "When you want to say no, what usually happens?", options: ["I say yes, and regret it", "I say maybe, to avoid saying no", "I say no, then explain at length", "I say no, then feel guilty for days", "I avoid replying"] }
      ]
    },
    practice: { tool: "saying-no", rest: 2 },
    challenge: {
      rest: 1, pts: 20, title: "One honest no",
      body: "Say one honest no this week. Keep it short and kind.\n\nThen let the other person have whatever they feel about it, without rushing to fix it.",
      reflect: { key: "how", label: "How it felt", prompt: "How did it feel, before and after?" }
    }
  },
  {
    id: "centre", short: "Return to yourself.", numeral: "VI", name: "The Centre", question: "Return to yourself.",
    lesson: {
      rest: 1,
      steps: [
        { type: "read", title: "A way back", body: "However steady you become, you'll still be pulled off centre sometimes. That isn't failure. It's what happens to people who care.\n\nWhat matters is having a way back." },
        { type: "read", title: "The pause", body: "Strong feelings move fast. A short pause between what happens and what you do is where your freedom lives.\n\nThe 90-Second Centre is that pause, made into a practice you can do almost anywhere." },
        { type: "read", quote: "Between what happens and what I do, there is a breath. That's where I live." }
      ]
    },
    practice: { tool: "ninety-second-centre", rest: 1 },
    challenge: {
      rest: 1, pts: 15, title: "Centre before you answer",
      body: "Use the 90-Second Centre once this week, in a real moment: before replying to a hard message, during a tense conversation, or after a draining day.\n\nIt's in your Library whenever you need it.",
      reflect: { key: "how", label: "What changed", prompt: "What did the pause change?" }
    }
  },
  {
    id: "sovereign", short: "Live from choice.", numeral: "VII", name: "The Sovereign", question: "I can love without losing myself.",
    lesson: {
      rest: 1,
      steps: [
        { type: "read", title: "Sovereign, not separate", body: "Being sovereign doesn't mean needing no one. It means you belong to yourself while you belong with others.\n\nYou stay open-hearted, and you don't leave yourself to do it." },
        { type: "reflect", key: "carry", label: "What I'll carry", prompt: "Of everything so far, what will you carry with you?" },
        { type: "read", title: "Your Sovereignty Code", body: "To close, you'll write a few commitments to yourself: how you choose to care, connect and stay centred.\n\nWords to return to whenever you're pulled away." }
      ]
    },
    practice: { tool: "sovereignty-code", rest: 1 },
    challenge: {
      rest: 1, pts: 20, title: "Live one line",
      body: "Choose one line of your Sovereignty Code and live it on purpose for a day.\n\nNotice how it feels to belong to yourself.",
      reflect: { key: "how", label: "How it felt", prompt: "How did it feel?" }
    }
  }
];

export const COMPLETION = {
  title: "You completed The Sovereign Empath",
  line: "You began by noticing what you were carrying. You leave knowing a little more clearly what is yours to carry, and what is not."
};

export const COURSE = {
  stages: STAGES,
  tools: TOOLS,
  checkIn: CHECK_IN,
  opening: { id: "begin", title: "Before you begin", steps: checkInSteps(false), rest: 0 },
  closing: { id: "close", title: "What changed", steps: checkInSteps(true) },
  challengeValueStep: valueStep,
  completion: COMPLETION
};

export default COURSE;
