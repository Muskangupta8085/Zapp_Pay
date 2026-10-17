const { Jimp } = require('./node_modules/jimp');
const path = require('path');

async function processImage() {
  const inputPath = path.join(__dirname, 'assets/images/logo_3d.png');
  const outputPath = path.join(__dirname, 'assets/images/logo_transparent.png');

  const img = await Jimp.read(inputPath);
  const w = img.bitmap.width;
  const h = img.bitmap.height;

  img.scan(0, 0, w, h, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];

    const brightness = Math.max(r, g, b);

    if (brightness < 20) {
      this.bitmap.data[idx + 3] = 0; // Pure transparent
    } else if (brightness < 65) {
      const alpha = (brightness - 20) / (65 - 20);
      this.bitmap.data[idx + 3] = Math.round(alpha * 255);
    }
  });

  await img.write(outputPath);
  console.log('SUCCESS: logo_transparent.png created!');
}

processImage().catch(console.error);
