// Shared scene + narration data. NO remotion imports here so the
// standalone voiceover generator can import it via `node --strip-types`.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// ElevenLabs voice to narrate the guide.
export const VOICE_ID = "wyWA56cQNU2KqUW4eCsI";

export type SceneMeta = {
  id: string; // also the mp3 filename stem
  min: number; // minimum frames if no/short audio (lets animations breathe)
  text: string; // narration
};

// Order MUST match the scene order rendered in ArmyGuide.tsx:
// title, idea, then the 6 units, then strategy, outro.
export const SCENES: SceneMeta[] = [
  {
    id: "00-title",
    min: 95,
    text: "Welcome to your Alien Hives field guide. The one rule that matters most: you win on objective markers, not on kills.",
  },
  {
    id: "01-idea",
    min: 150,
    text: "Scoring is the final snapshot. Whoever holds the most markers when round four ends, wins. So grind his army for three rounds, then flood the markers. Your beasts soak the fire while your fast units score.",
  },
  {
    id: "02-carnivo",
    min: 150,
    text: "The Carnivo-Rex is your hammer. Thirteen attacks shred an infantry blob or a Defense-two vehicle. Just never let it fight a Deadly-three walker alone, and don't let cheap troops tar-pit it.",
  },
  {
    id: "03-toxico",
    min: 150,
    text: "The Toxico-Rex is your anvil, so lead with it. Regeneration lets it eat the enemy's best guns, and its Bane whip ignores their armour and their healing. Don't hide it; its whole job is to soak fire up front.",
  },
  {
    id: "04-burrower",
    min: 150,
    text: "The Hive Burrower waits in reserve, then ambushes on round two, dropping next to his scariest gun and charging it. It cripples and pins the crew. Just remember it can't grab a marker the turn it arrives.",
  },
  {
    id: "05-soulsnatchers",
    min: 150,
    text: "Soul-Snatchers are your scorers and your tank-grinders. They're fast, so hunt his transports and pop them before the troops climb out, then flood the markers. Don't push them out ahead of your monsters.",
  },
  {
    id: "06-mortar",
    min: 145,
    text: "The Mortar Beast is your anti-horde gun. Park it in the back and never move it. Indirect fire ignores cover and needs no line of sight. This is your answer to a swarm.",
  },
  {
    id: "07-snatcherlord",
    min: 145,
    text: "The Snatcher Lord guards your home marker and denies his ambush a place to land. Late game, he darts in to contest. Keep him behind a beast, because snipers love a lone hero.",
  },
  {
    id: "08-strategy",
    min: 220,
    text: "Here's the plan. Rounds one and two: cross the table and soak his fire. Rounds two and three: grind him down. Round four: flood every marker and contest his. Most markers at the end wins.",
  },
  {
    id: "09-outro",
    min: 110,
    text: "Remember: most markers at the end of round four. Beasts soak, fast units score. Now go kill Bill.",
  },
];

export const audioPath = (id: string) => `voiceover/${id}.mp3`;
