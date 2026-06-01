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
    text: "Welcome to your Alien Hives field guide. This army is a tank-and-kill spearhead. You seize the markers early, then you destroy everything that could take them back.",
  },
  {
    id: "01-idea",
    min: 150,
    text: "Here's what matters. When you tag a marker, it stays yours, even after you leave, until he touches it again. And if you both stand on one, it's only a tie. So don't camp. Seize early, then send your monsters in to kill. Every unit you destroy is one that can't take your ground back.",
  },
  {
    id: "02-carnivo",
    min: 150,
    text: "The Carnivo-Rex is your hammer. Thirteen attacks shred an infantry blob or a Defense-two vehicle. Throw it straight into his line and kill. Just never let it fight a Deadly-three walker alone.",
  },
  {
    id: "03-toxico",
    min: 150,
    text: "The Toxico-Rex is your anvil, so lead with it. Regeneration lets it eat his best guns while it carves through his army, and its Bane whip ignores armour and healing. Push it forward; never hide it.",
  },
  {
    id: "04-burrower",
    min: 150,
    text: "The Hive Burrower waits in reserve, then ambushes on round two, dropping behind his lines to murder a key gun or a fast unit before it can ever reach your markers. Hit what hurts you most.",
  },
  {
    id: "05-soulsnatchers",
    min: 150,
    text: "Soul-Snatchers are your taggers and tank-grinders. Sprint out, seize a marker, then peel off and kill. Hunt his transports and pop them before the troops climb out. Tag, then go aggressive.",
  },
  {
    id: "06-mortar",
    min: 145,
    text: "The Mortar Beast is your fire support. Park it in the back and never move it. Indirect fire ignores cover and needs no line of sight, so use it to gun down anything creeping toward your markers.",
  },
  {
    id: "07-snatcherlord",
    min: 145,
    text: "The Snatcher Lord is your fast flanker. Send him wide to tag a far marker early, then hunt his backfield. Keep him behind cover, because snipers love a lone hero.",
  },
  {
    id: "08-strategy",
    min: 220,
    text: "The plan. Round one: rush out and tag the markers; they stay yours. Rounds two and three: drive your monsters into his army and kill everything that could take your ground. Round four: clear any enemy off the markers you want, and own them outright. Don't settle for a tie; kill him off it.",
  },
  {
    id: "09-outro",
    min: 110,
    text: "Seize early, then go aggressive. Kill everything that could take your ground. That is how you win. Now go kill Bill.",
  },
];

export const audioPath = (id: string) => `voiceover/${id}.mp3`;
