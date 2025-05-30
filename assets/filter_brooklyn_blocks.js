const fs = require('fs');

const input = JSON.parse(fs.readFileSync('assets/2020 Census Blocks_20250529.geojson', 'utf8'));
const brooklyn = {
  type: 'FeatureCollection',
  features: input.features.filter(f => f.properties.borocode === "3" || f.properties.boroname === "Brooklyn")
};
fs.writeFileSync('assets/brooklyn_blocks.geojson', JSON.stringify(brooklyn));
console.log('Filtered Brooklyn blocks saved to assets/brooklyn_blocks.geojson');