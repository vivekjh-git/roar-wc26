const sharp = require('sharp');
const fs = require('node:fs');

async function createFavicon() {
  const width = 512;
  const r = width / 2;
  
  // Create a circular SVG mask with an orange border
  const circleSvg = `<svg width="${width}" height="${width}">
    <!-- Background circle for masking -->
    <circle cx="${r}" cy="${r}" r="${r - 10}" fill="black" />
  </svg>`;

  try {
    await sharp('public/tiger.png')
      .resize(width, width, { fit: 'cover' })
      // Mask it with the circle to make it transparent outside
      .composite([{
        input: Buffer.from(circleSvg),
        blend: 'dest-in'
      }])
      .png()
      .toFile('public/favicon.png');
    
    console.log('Favicon created successfully!');
  } catch (err) {
    console.error('Error creating favicon:', err);
  }
}

createFavicon();
