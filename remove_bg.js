const Jimp = require('jimp');
const path = require('path');

async function makeTransparent() {
  const inputPath = path.join(__dirname, 'frontend/assets/images/logo_3d.png');
  const outputPath = path.join(__dirname, 'frontend/assets/images/logo_transparent.png');

  const image = await Jimp.read(inputPath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  image.scan(0, 0, width, height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];

    // Calculate maximum intensity and distance from center
    const maxVal = Math.max(r, g, b);
    
    // Smooth thresholding
    if (maxVal < 18) {
      this.bitmap.data[idx + 3] = 0; // Completely transparent
    } else if (maxVal < 60) {
      // Smooth feathering
      const alphaFactor = (maxVal - 18) / (60 - 18);
      this.bitmap.data[idx + 3] = Math.round(alphaFactor * 255);
    }
  });

  await image.writeAsync(outputPath);
  console.log('Transparent logo saved successfully to:', outputPath);
}

makeTransparent().catch(console.error);
