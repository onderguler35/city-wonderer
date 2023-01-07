var openMapAPIKey = '5ae2e3f221c38a28845f05b6ba80233b310c7a56ad48628d52fcdbe3';
var cityName = 'London';
var openMapKinds = 'theatres_and_entertainments'; //accomodations, architecture, museums, theatres_and_entertainments, historic, tourist_facilities
var openMapLimit = '15';
var openMapRadius = '1000'; //meters
var searchInput = $('#city');
var addButton = $('#add-btn');
var asideContainer = $('.aside');
const mapTilerKey = "NtCHCLnEB2T8gRRbY03N";
const otmKey = "5ae2e3f221c38a28845f05b6e7ab02f17ff4dbd94eaeeefe20c5e4d6";
var map;

init();

//Capture input data and pass it to next function
function init() {
    $("#search-city").on("submit", function (event) {
        cityName = searchInput.val();
        event.preventDefault();
        getCoordinates(cityName);        
    })
};

//Get coordinates for the searched for place using OpenTrip API
function getCoordinates(placeName) {

    //Check if there is a town name provided, request the data from the API and call functions to display it
    if (placeName) {      

        var lon = '';
        var lat = '';
      
        var url = `https://api.opentripmap.com/0.1/en/places/geoname?name=${placeName}&apikey=${openMapAPIKey}`;
        
        $.get(url) 
      
          .then(function (coorData) {

            if (coorData.status === 'OK') {
                lon = coorData.lon;
                lat = coorData.lat;
            }
            
            searchInput.val("");
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
  
            if (poiData.features.length > 0) {
                
                var poiArray = [];

                for (var poi of poiData.features) {
                    poiArray.push({
                        lon: poi.geometry.coordinates[0],
                        lat: poi.geometry.coordinates[1],
                        name: poi.properties.name,
                        wikidata: poi.properties.wikidata
                    }) ;
                }
                
                renderMap(lon, lat);
                addMarkersToMap(poiData.features);
                populatePOIAside(poiArray);
                
            } else {
              console.log ("no results")
            }

          });
    }

}

//Get 5 day forecast for the given coordinates
function getWeather(lon, lat) {

}

//Populate the right-hand-side area with the places of interest, each being a link to the wikidata pagecd
function populatePOIAside(poiArray) {

  $('.city-link').remove();

  for (var poi of poiArray) {
    asideContainer.append(`
    <a class="city-link" href="https://www.wikidata.org/wiki/${poi.wikidata}" target="_blank">${poi.name}</a>
    `);
  }
  
}

function renderMap(lon, lat) {

  //mapZoomLocation = [51.458580017089844, -2.116158962249756]; //Latitude, longitude. Chippenham
  
  //Clear map if it needs to display further results
  if (map != null) {
    map.remove();
  }

  mapZoomLocation = [lat, lon];
  zoomLevel = 14; // Higher number = larger zoom.
  map = L.map("map").setView(mapZoomLocation, zoomLevel);

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

    const lat = poi.geometry.coordinates[1];
    const lon = poi.geometry.coordinates[0];
    const poiTitle = poi.properties.name;
    const wikidataID = poi.properties.wikidata;
    const poiType = poi.properties.kinds.replaceAll(",", " ").split(" ");
    let poiTypeMarkup = "";

    poiType.forEach((type, index) => {
      if (index >= 2) return;
      poiTypeMarkup += type.replace("_", " ") + " <br>";
    });

    L.marker([lat, lon])
      .addTo(map)
      .bindPopup(
        `<h3>${poiTitle}</h3><h5>CATEGORY: <br> ${poiTypeMarkup} </h5> <a href=\'https://www.wikidata.org/wiki/${wikidataID}\' target="_blank">Visit Wikidata page.</a> `
      );
  }
}


