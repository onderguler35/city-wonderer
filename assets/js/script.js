var openMapAPIKey = '5ae2e3f221c38a28845f05b6ba80233b310c7a56ad48628d52fcdbe3';
var cityName = 'London';
var openMapKinds = 'theatres_and_entertainments'; //accomodations, architecture, museums, theatres_and_entertainments, historic, tourist_facilities
var openMapLimit = '15';
var openMapRadius = '1000'; //meters

//Capture input data and pass it to next function
function init() {
    $("#search-city").on("submit", function (event) {
        cityName = $("#city").val();
        event.preventDefault();
        getCoordinates(cityName);
        console.log(cityName);
    })
};
init();

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
