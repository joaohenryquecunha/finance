const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  const inputSvg = path.join(process.cwd(), 'public', 'icons', 'icon.svg');
  const outputDir = path.join(process.cwd(), 'public', 'icons');

  // Ensure the output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Generate PNG icons for each size
  for (const size of sizes) {
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    
    console.log(`Generated ${size}x${size} icon`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);