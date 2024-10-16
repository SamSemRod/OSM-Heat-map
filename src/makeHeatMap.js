/* eslint-disable camelcase */
const all_points = [];
const flats_points = [];
const levels_points = [];

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

async function fetchFlatsFromOverpassAPI() {
  const overpassFlatsURL = `https://maps.mail.ru/osm/tools/overpass/api/interpreter?data=[out:json][timeout:180];
  (
    way["building:flats"](59.7590, 30.0882, 60.1085, 30.7603);
  ) -> .buildings;
  way.buildings; out center tags;`;

  try {
    const response = await fetch(overpassFlatsURL);
    const data = await response.json();
    console.log('Flats data:', data);

    data.elements.forEach((element) => {
      if (element.center && element.tags['building:flats']) {
        flats_points.push([
          element.center.lat,
          element.center.lon,
          parseInt(element.tags['building:flats'], 10) / 100,
        ]);
      }
    });

    console.log('Flats points fetched:', flats_points);
  } catch (error) {
    console.error('Error fetching flats data from Overpass API:', error);
  }
}

async function fetchLevelsFromOverpassAPI() {
  const overpassLevelsURL = `https://maps.mail.ru/osm/tools/overpass/api/interpreter?data=[out:json][timeout:180];
  (
    way["building:levels"](59.7590, 30.0882, 60.1085, 30.7603);
  ) -> .buildings;
  way.buildings; out center tags;`;

  try {
    const response = await fetch(overpassLevelsURL);
    const data = await response.json();
    console.log('Levels data:', data);

    data.elements.forEach((element) => {
      if (element.center && element.tags['building:levels']) {
        const levels = parseInt(element.tags['building:levels'], 10);
        const flats = levels * 30;
        levels_points.push([element.center.lat, element.center.lon, flats / 100]);
      }
    });

    console.log('Levels points fetched:', levels_points);
  } catch (error) {
    console.error('Error fetching levels data from Overpass API:', error);
  }
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
      if (element.lat && element.lon && element.tags['addr:flats']) {
        all_points.push([
          element.lat,
          element.lon,
          countFlats(element.tags['addr:flats']),
        ]);
      }
    });

    console.log('Points fetched from Overpass API:', all_points);
  } catch (error) {
    console.error('Error fetching data from Overpass API:', error);
  }
}

async function initializeMap() {
  let map = L.map('map').setView([59.939274, 30.315289], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map);

  await Promise.all([
    fetchPointsFromOverpassAPI(),
    fetchFlatsFromOverpassAPI(),
    fetchLevelsFromOverpassAPI(),
  ]);

  const final_points = all_points.concat(flats_points, levels_points);
  console.log('Combined points:', final_points);

  L.heatLayer(final_points, {
    radius: 25,
    minOpacity: 0.3,
    gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' },
  }).addTo(map);
}

initializeMap();
