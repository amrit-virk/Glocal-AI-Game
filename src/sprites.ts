/** Original 32 × 48 pixel characters, drawn at the room's scale. */
export function sprite(coat: string, walking = false): string {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 48;
  const context = canvas.getContext("2d")!;
  const rect = (x: number, y: number, width: number, height: number, color: string) => {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  };
  const shade = (factor: number) => "#" + coat.slice(1).match(/../g)!
    .map((value) => Math.min(255, Math.round(parseInt(value, 16) * factor)).toString(16).padStart(2, "0")).join("");
  // Narrow shoulders, long coat, and shaded trousers keep adult proportions.
  rect(10, 29, 12, 15, "#1c2832");
  rect(11, 32, 4, 11, "#34434b");
  rect(18, 32, 3, 11, "#2a3841");
  rect(15, 35, 3, 9, "#111d27");
  const leftStep = walking ? -1 : 0;
  const rightStep = walking ? 1 : 0;
  rect(9 + leftStep, 43, 6, 3, "#141b23");
  rect(18 + rightStep, 43, 6, 3, "#141b23");
  rect(9 + leftStep, 43, 5, 1, "#65584a");
  rect(18 + rightStep, 43, 5, 1, "#65584a");
  rect(8, 17, 16, 15, shade(.64));
  rect(10, 17, 12, 14, coat);
  rect(11, 19, 3, 10, shade(1.12));
  rect(15, 17, 3, 14, shade(.76));
  rect(14, 17, 4, 5, "#c4b69b");
  rect(15, 21, 2, 10, shade(.55));
  rect(18, 25, 4, 1, shade(.63));
  rect(15, 24, 1, 1, "#e0c18d");
  rect(15, 28, 1, 1, "#e0c18d");
  rect(6, 19, 4, 11, shade(.78));
  rect(22, 19, 4, 11, shade(.62));
  rect(6, 29, 4, 4, "#b88360");
  rect(22, 29, 4, 4, "#c8936b");
  rect(13, 14, 6, 4, "#ad7957");
  rect(10, 4, 12, 11, "#c48e65");
  rect(11, 5, 9, 9, "#dbac7c");
  rect(10, 3, 12, 4, "#292a2e");
  rect(12, 2, 8, 2, "#383337");
  rect(10, 6, 2, 5, "#3a3031");
  rect(20, 5, 2, 6, "#3a3031");
  rect(12, 3, 6, 2, "#4d3d38");
  rect(12, 9, 2, 1, "#28303a");
  rect(18, 9, 2, 1, "#28303a");
  rect(16, 10, 1, 2, "#be8960");
  rect(14, 13, 4, 1, "#94694f");
  return canvas.toDataURL();
}
