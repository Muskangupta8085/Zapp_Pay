const { Jimp, intToRGBA, rgbaToInt } = require('./node_modules/jimp');
const path = require('path');

async function removeBackground(filename) {
  const filePath = path.join(__dirname, 'assets/images', filename + '.png');
  const img = await Jimp.read(filePath);
  const w = img.bitmap.width;
  const h = img.bitmap.height;

  // Track visited background pixels
  const visited = new Uint8Array(w * h);
  const queue = [];

  // Helper to check if a pixel is background color (off-white / light neutral)
  function isBgPixel(idx) {
    const r = img.bitmap.data[idx];
    const g = img.bitmap.data[idx + 1];
    const b = img.bitmap.data[idx + 2];
    
    // Background pixels in our images have r,g,b > 230 and very low saturation
    const minC = Math.min(r, g, b);
    const maxC = Math.max(r, g, b);
    const diff = maxC - minC;

    return minC >= 232 && diff < 16;
  }

  function isFeatherPixel(idx) {
    const r = img.bitmap.data[idx];
    const g = img.bitmap.data[idx + 1];
    const b = img.bitmap.data[idx + 2];
    const minC = Math.min(r, g, b);
    const maxC = Math.max(r, g, b);
    const diff = maxC - minC;

    return minC >= 210 && diff < 24;
  }

  // Seed BFS queue from all outer border pixels
  for (let x = 0; x < w; x++) {
    queue.push([x, 0]);
    queue.push([x, h - 1]);
  }
  for (let y = 0; y < h; y++) {
    queue.push([0, y]);
    queue.push([w - 1, y]);
  }

  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    const pos = cy * w + cx;
    if (visited[pos]) continue;
    visited[pos] = 1;

    const idx = pos * 4;
    if (isBgPixel(idx)) {
      img.bitmap.data[idx + 3] = 0; // Pure transparent

      // Check 4-directional neighbors
      if (cx > 0) queue.push([cx - 1, cy]);
      if (cx < w - 1) queue.push([cx + 1, cy]);
      if (cy > 0) queue.push([cx, cy - 1]);
      if (cy < h - 1) queue.push([cx, cy + 1]);
    } else if (isFeatherPixel(idx)) {
      // Soft antialiasing boundary
      const r = img.bitmap.data[idx];
      const g = img.bitmap.data[idx + 1];
      const b = img.bitmap.data[idx + 2];
      const minC = Math.min(r, g, b);
      const alpha = Math.max(0, Math.min(255, Math.round(((235 - minC) / 25) * 255)));
      img.bitmap.data[idx + 3] = alpha;
    }
  }

  await img.write(filePath);
  console.log(`Successfully made ${filename}.png transparent!`);
}

async function run() {
  for (const name of ['onboarding_wallet', 'onboarding_security', 'onboarding_rewards']) {
    await removeBackground(name);
  }
  console.log('ALL 3 ONBOARDING IMAGES ARE NOW 100% TRANSPARENT!');
}

run().catch(console.error);
