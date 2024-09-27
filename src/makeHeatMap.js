/* eslint-disable camelcase */
const all_points = [];
const shop_points = [];

function countFlats(inputStr) {
  let res_incude = 0;
  const ranges = inputStr.split(';');
  for (const r of ranges) {
    if (r.includes('-')) {
      const [start, end] = r.split('-').map(Number);
      res_incude += end - start + 1;
    } else {
      res_incude += 1;
    }
  }
  return res_incude;
}

async function fetchPointsFromOverpassAPI() {
  const overpassURL = `https://maps.mail.ru/osm/tools/overpass/api/interpreter?data=[out:json];
  (node["entrance"="staircase"](59.7590, 30.0882, 60.1085, 30.7603);
  node["addr:flats"](59.7590, 30.0882, 60.1085, 30.7603);
  node["entrance"="yes"]["ref"](59.7590, 30.0882, 60.1085, 30.7603);
  node[name~"пят(е|ё)рочка",i](59.7590, 30.0882, 60.1085, 30.7603);
  node[name="Магнит"](59.7590, 30.0882, 60.1085, 30.7603);
  node[name="Семишагофф"](59.7590, 30.0882, 60.1085, 30.7603);
  node[name="Дикси"](59.7590, 30.0882, 60.1085, 30.7603););out;`;
  try {
    const response = await fetch(overpassURL);
    const data = await response.json();
    console.log(data);
    data.elements.forEach((element) => {
      if (
        element.tags.shop &&
        (element.tags.shop === 'supermarket' ||
          element.tags.shop === 'convenience')
      ) {
        shop_points.push([element.lat, element.lon, element.tags.brand]);
      }
      if (element.lat && element.lon && element.tags['addr:flats']) {
        all_points.push([
          element.lat,
          element.lon,
          countFlats(element.tags['addr:flats']),
        ]);
      }
    });

    console.log('Points fetched from Overpass API:', all_points);
    console.log('Shop points fetched from Overpass API:', shop_points);
  } catch (error) {
    console.error('Error fetching data from Overpass API:', error);
  }
}

function generatePoints() {
  const points = [];
  let n = 0;
  for (let i = 0; i < all_points.length; i++) {
    all_points[i][2] /= 100;
  }
  points.push(...all_points);
  console.log('Generated points:', points);
  return points;
}

async function initializeMap() {
  let map = L.map('map').setView([59.939274, 30.315289], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map);

  await fetchPointsFromOverpassAPI();
  let final_points = generatePoints();
  console.log(final_points);

  let heat = L.heatLayer(final_points, {
    radius: 25,
    minOpacity: 0.3,
    gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' },
  }).addTo(map);
  const smallIcon = L.icon({
    iconUrl: 'icons8-маркер-24.png',
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });
  shop_points.slice(0, 1000).forEach((point) => {
    L.marker([point[0], point[1]], { icon: smallIcon })
      .addTo(map)
      .bindPopup(point[2]);
  });
}

initializeMap();
