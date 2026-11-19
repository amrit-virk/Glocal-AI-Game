const pixels = [
  "................",
  ".....hhhhhh.....",
  "....hhhhhhhh....",
  "....hhsssshh....",
  "....hsessesh....",
  "....hssssssh....",
  ".....ssssss.....",
  "......ss........",
  "....cccccccc....",
  "...cccccccccc...",
  "...sccccccccs...",
  "...sccccccccs...",
  "...sccccccccs...",
  "....cccccccc....",
  "....cccccccc....",
  ".....pppppp.....",
  ".....pppppp.....",
  ".....pp.ppp.....",
  ".....pp.pp......",
  ".....bb.bb......",
  "....bbb.bbb.....",
  "................",
];

export function sprite(coat: string, walking = false): string {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 22;
  const context = canvas.getContext("2d")!;
  const palette: Record<string, string> = {
    h: "#302b39", s: "#dca779", e: "#252334", c: coat, p: "#273749", b: "#151d29",
  };
  pixels.forEach((row, y) => [...row].forEach((pixel, x) => {
    if (!palette[pixel]) return;
    context.fillStyle = palette[pixel];
    const offset = walking && y >= 17 ? (x < 8 ? -1 : 1) : 0;
    context.fillRect(x + offset, y, 1, 1);
  }));
  return canvas.toDataURL();
}
