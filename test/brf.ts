const BRF_ASCII =
  " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_";

const UNICODE_BRAILLE =
  "⠀⠮⠐⠼⠫⠩⠯⠄⠷⠾⠡⠬⠠⠤⠨⠌⠴⠂⠆⠒⠲⠢⠖⠶⠦⠔⠱⠰⠣⠿⠜⠹⠈⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵⠪⠳⠻⠘⠸";

const brfCells = new Map<string, string>();

for (let index = 0; index < BRF_ASCII.length; index += 1) {
  const ascii = BRF_ASCII[index];
  const braille = UNICODE_BRAILLE[index];
  if (ascii !== undefined && braille !== undefined) {
    brfCells.set(ascii, braille);
  }
}

export function fromBrf(brf: string): string {
  let braille = "";
  for (const character of brf) {
    if (character === "\n") {
      braille += character;
      continue;
    }
    const cell = brfCells.get(character);
    if (cell === undefined) {
      throw new Error(`Unsupported BRF test character: ${character}`);
    }
    braille += cell;
  }
  return braille;
}
