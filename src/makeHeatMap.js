const all_points = [];

async function fetchPoints() {
  try {
    const response = await fetch('/src/data.geojson');
    const data = await response.json();

    data.features.forEach((feature) => {
      if (feature.geometry && feature.geometry.coordinates) {
        const lon = feature.geometry.coordinates[0];
        const lat = feature.geometry.coordinates[1];
        all_points.push([lat, lon]);
      }
    });

    console.log('Points fetched:', all_points);
  } catch (error) {
    console.error('Error loading GeoJSON file:', error);
  }
}

function generatePoints() {
  const points = [];
  let n = 0;
  for (let i = 0; i < all_points.length; i++) {
    all_points[i].push(Math.random());
  }
  while (n < all_points.length && n <= 1000) {
    points.push(all_points[Math.floor(Math.random() * all_points.length)]);
    n++;
  }
  console.log('Generated points:', points);
  return points;
}
async function initializeMap() {
  let map = L.map('map').setView([59.939274, 30.315289], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map);

  await fetchPoints();
  let final_points = generatePoints();
  console.log(final_points);

  let heat = L.heatLayer(final_points, {
    radius: 25,
    minOpacity: 0.3,
    gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' },
  }).addTo(map);
}

initializeMap();
