const mapTilerKey = "NtCHCLnEB2T8gRRbY03N";
const otmKey = "5ae2e3f221c38a28845f05b6e7ab02f17ff4dbd94eaeeefe20c5e4d6";

mapZoomLocation = [51.458580017089844, -2.116158962249756]; //Latitude, longitude. Chippenham
zoomLevel = 12; // Higher number = larger zoom.
var map = L.map("map").setView(mapZoomLocation, zoomLevel);


function renderMap() {
  L.tileLayer(
    `https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=${mapTilerKey}`,
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  ).addTo(map);
}

//Add Markers to a map, acceps objects array from API
function addMarkersToMap(POIs) {
  for (const poi of POIs) {
    const lat = poi.point.lat;
    const lon = poi.point.lon;
    const poiTitle = poi.name;
    const wikidataID = poi.wikidata;
    const poiType = poi.kinds.replaceAll(",", " ").split(" ");
    let poiTypeMarkup = "";

    poiType.forEach((type, index) => {
      if (index >= 2) return;
      poiTypeMarkup += type.replace("_", " ") + " <br>";
    });

    L.marker([lat, lon])
      .addTo(map)
      .bindPopup(
        `<h3>${poiTitle}</h3><h5>CATEGORY: <br> ${poiTypeMarkup} </h5> <a href=\'https://www.wikidata.org/wiki/${wikidataID}\' >Visit Wikidata page.</a> `
      );
  }
}

renderMap();
