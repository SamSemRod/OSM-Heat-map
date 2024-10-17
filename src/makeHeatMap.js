/* eslint-disable camelcase */
let all_points = [];
const flats_points = [];
const levels_points = [];
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

async function fetchShops() {
  const overpassShopsURL = `https://maps.mail.ru/osm/tools/overpass/api/interpreter?data=[out:json];
  (
    node[name~"пят(е|ё)рочка",i](59.7590, 30.0882, 60.1085, 30.7603);
    node[name="Магнит"](59.7590, 30.0882, 60.1085, 30.7603);
    node[name="Семишагофф"](59.7590, 30.0882, 60.1085, 30.7603);
    node[name="Дикси"](59.7590, 30.0882, 60.1085, 30.7603););out;`;

  try {
    const response = await fetch(overpassShopsURL);
    const data = await response.json();
    console.log('Shops data:', data);

    data.elements.forEach((element) => {
      if (
        element.tags.shop
        && (element.tags.shop === 'supermarket'
          || element.tags.shop === 'convenience')
      ) {
        shop_points.push([
          element.lat,
          element.lon,
          element.tags.brand]);
      }
    });

    console.log('Shops points fetched:', shop_points);
  } catch (error) {
    console.error('Error fetching shops data from Overpass API:', error);
  }
}

async function fetchDataAndFilter() {
  const overpassURL = `https://maps.mail.ru/osm/tools/overpass/api/interpreter?data=[out:json];
  (way["building:levels"][building=apartments](59.7590,30.0882,60.1085,30.7603);
  node["entrance"="staircase"](59.7590,30.0882,60.1085,30.7603);
  node["addr:flats"](59.7590,30.0882,60.1085,30.7603);
  node["entrance"="yes"]["ref"](59.7590,30.0882,60.1085,30.7603);
  way["building:flats"](59.7590,30.0882,60.1085,30.7603););out center tags;`;

  try {
    const response = await fetch(overpassURL);
    const data = await response.json();

    const buildingsWithFlats = {};
    const buildingsWithEntrances = {};
    const buildingsWithLevels = {};

    data.elements.forEach((element) => {
      if (element.type === 'way' && element.tags['building:flats']) {
        const buildingKey = `${element.tags['addr:housenumber']}_${element.tags['addr:street']}`;
        buildingsWithFlats[buildingKey] = {
          lat: element.center.lat,
          lon: element.center.lon,
          flats: parseInt(element.tags['building:flats'], 10),
        };
      }
    });

    data.elements.forEach((element) => {
      if (element.type === 'node' && element.tags.entrance) {
        const buildingKey = `${element.tags['addr:housenumber']}_${element.tags['addr:street']}`;
        if (!buildingsWithFlats[buildingKey]) {
          buildingsWithEntrances[buildingKey] = {
            lat: element.lat,
            lon: element.lon,
          };
        }
      }
    });

    data.elements.forEach((element) => {
      if (element.type === 'way' && element.tags['building:levels']) {
        const buildingKey = `${element.tags['addr:housenumber']}_${element.tags['addr:street']}`;
        if (!buildingsWithFlats[buildingKey] && !buildingsWithEntrances[buildingKey]) {
          const levels = parseInt(element.tags['building:levels'], 10);
          const flats = levels * 30;
          buildingsWithLevels[buildingKey] = {
            lat: element.center.lat,
            lon: element.center.lon,
            flats,
          };
        }
      }
    });

    all_points = [
      ...Object.values(buildingsWithFlats),
      ...Object.values(buildingsWithEntrances),
      ...Object.values(buildingsWithLevels),
    ];

    console.log(all_points);
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
    fetchDataAndFilter(),
    fetchShops(),
  ]);

  const final_points = all_points.concat(flats_points, levels_points);
  console.log('Combined points:', final_points);

  L.heatLayer(all_points, {
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
