var openMapAPIKey = '5ae2e3f221c38a28845f05b6ba80233b310c7a56ad48628d52fcdbe3';
var cityName = 'London';
var openMapKinds = 'theatres_and_entertainments'; //accomodations, architecture, museums, theatres_and_entertainments, historic, tourist_facilities
var openMapLimit = '15';
var openMapRadius = '1000'; //meters

getCoordinates(cityName);


//Get coordinates for the searched for place using OpenTrip API
function getCoordinates(placeName) {

    //Check if there is a town name provided, request the data from the API and call functions to display it
    if (placeName) {      

        var lon = '';
        var lat = '';
      
        var url = `https://api.opentripmap.com/0.1/en/places/geoname?name=${placeName}&apikey=${openMapAPIKey}`;
        
        $.get(url) 
      
          .then(function (coorData) {
  
            //console.log(coorData)
            if (coorData.status === 'OK') {
                lon = coorData.lon;
                lat = coorData.lat;
            }
            //console.log(lon)
            //console.log(lat)

            getPOI(lon, lat);
            getWeather(lon, lat);
          });
  
        
    }
}

//Get Points Of Interest for the given coordinates
function getPOI(lon, lat) {
    
    if (lon !== '' && lat !== '') {

        var url = `https://api.opentripmap.com/0.1/en/places/radius?radius=${openMapRadius}&lon=${lon}&lat=${lat}&kinds=${openMapKinds}&limit=10&apikey=${openMapAPIKey}`;
        
        $.get(url) 
      
          .then(function (poiData) {
  
            //console.log(poiData)
            if (poiData.features.length > 0) {
                console.log(poiData.features[0])
                
                var poiArray = [];

                for (var poi of poiData.features) {
                    poiArray.push({
                        lon: poi.geometry.coordinates[0],
                        lat: poi.geometry.coordinates[1],
                        name: poi.properties.name,
                        wikidata: poi.properties.wikidata
                    }) ;
                }
                //console.log (poiArray);
                populatePOIAside(poiArray);
                //populatePOIMap(poiArray);
            }
            

          });
    }

}

//Get 5 day forecast for the given coordinates
function getWeather(lon, lat) {

}

//Populate the right-hand-side area with the places of interest, each being a link to the wikidata pagecd
function populatePOIAside(poiArray) {

    //https://www.wikidata.org/wiki/Q5694616
}
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
