const openMapAPIKey =
  "5ae2e3f221c38a28845f05b6ba80233b310c7a56ad48628d52fcdbe3";
const weatherAPIKey = "6ca9f0eebaa8221a45b6dae6209aad2c";
const mapTilerKey = "NtCHCLnEB2T8gRRbY03N";
const searchInput = $("#city");
const addButton = $("#add-btn");
const asideContainer = $(".aside");
const weatherCardWrapper = $("#five-day");
const dropDownWishList = $(".dropdown-menu");
const cityNewsSection = $("#categoryGrid");
const resultsSection = $("#results-section");
const todayDate = moment();

var cityName = "London";
var openMapKinds = "theatres_and_entertainments"; //accomodations, architecture, museums, theatres_and_entertainments, historic, tourist_facilities
var openMapLimit = "23";
var openMapRadius = "1000"; //meters
var map;

init();

//Capture input data and pass it to next function
function init() {
  $("#search-city").on("submit", function (event) {
    cityName = searchInput.val();
    event.preventDefault();
    getCoordinates(event);
  });

  addButton.on("click", function (event) {
    addPoiToLocalStorage(cityName, poiName);
  });

  //Capture the click of the wishlist buttons from the drop-down
  dropDownWishList.on("click", function (e) {
    getCoordinates(e);
  });

  populateWishListDropDown();
}

//Get coordinates for the searched for place using OpenTrip API
function getCoordinates(event) {
  var placeName = "";
  //Check the trigger - search button or wishlist button and get the town name
  if (event.type == "submit") {
    placeName = searchInput.val();
  } else if (event.type == "click") {
    placeName = event.target.innerText;
  }

  //Check if there is a town name provided, request the data from the API and call functions to display it
  if (placeName) {
    var lon = "";
    var lat = "";

    var url = `https://api.opentripmap.com/0.1/en/places/geoname?name=${placeName}&apikey=${openMapAPIKey}`;

    $.get(url).then(function (coorData) {
      if (coorData.status === "OK") {
        lon = coorData.lon;
        lat = coorData.lat;
      }

      searchInput.val("");
      cityNewsSection.addClass('d-none');
      resultsSection.removeClass('d-none');
      getPOI(lon, lat);
      getWeather(lon, lat);
      renderMap(lon, lat);
      cityLatLon = [lat, lon];

    });
  }
}

//Get Points Of Interest for the given coordinates
function getPOI(lon, lat) {
  if (lon !== "" && lat !== "") {
    var url = `https://api.opentripmap.com/0.1/en/places/radius?radius=${openMapRadius}&lon=${lon}&lat=${lat}&kinds=${openMapKinds}&limit=${openMapLimit}&apikey=${openMapAPIKey}`;

    $.get(url).then(function (poiData) {
      
      var poiArray = [];
      
      if (poiData.features.length > 0) {
        

        for (var poi of poiData.features) {
          poiArray.push({
            lon: poi.geometry.coordinates[0],
            lat: poi.geometry.coordinates[1],
            name: poi.properties.name,
            wikidata: poi.properties.wikidata,
          });
        }

        addMarkersToMap(poiData.features);
        populatePOIAside(poiArray);
      } else {
        //No POI results scenario. Send an empty array to clear any previous POIs
        populatePOIAside(poiArray);
      }
    });
  }
}

//Get 5 day forecast for the given coordinates
function getWeather(lon, lat) {
  $.get(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherAPIKey}&units=metric`
  ).then(function (forecastData) {
    displayForecastWeather(forecastData);
  });
}

//Add the five cards on the page with forecast for the next five days
function displayForecastWeather(forecastData) {
  weatherCardWrapper.html("");

  var lastForecastObj = null;
  var numNoonForecast = 0;
  var forecastMoment = null;

  //Loop through the results for the next 5 days
  for (var forecastObj of forecastData.list) {
    forecastMoment = moment.unix(forecastObj.dt);
    lastForecastObj = forecastObj;

    //Filter results for the next 5 days forecast at 12 noon
    if (
      forecastMoment.format("DD") > todayDate.format("DD") &&
      forecastMoment.format("HH") == "12"
    ) {
      numNoonForecast++;

      weatherCardWrapper.append(`
      <div class="weather-card">
        <h5>${forecastMoment.format("ddd, DD MMM")}</h3>
        <img class="inline" src="https://openweathermap.org/img/w/${
          forecastObj.weather[0].icon
        }.png" alt="${forecastObj.weather[0].description}" title="${
        forecastObj.weather[0].description
      }">
        <p>Temp: ${Math.round(forecastObj.main.temp)}&deg C</p>
        <p>Wind: ${forecastObj.wind.speed} m/s</p>
        <p>Humidity: ${forecastObj.main.humidity}%</p>
      </div>     
      `);
    }
  }

  //If the response from the API does not contain forecase for 12 noon on the 5th day,
  //then display the last available forecase for that day
  if (numNoonForecast <= 4) {
    forecastMoment = moment.unix(lastForecastObj.dt);

    weatherCardWrapper.append(`
    <div class="weather-card">
      <h5>${forecastMoment.format("ddd, DD MMM")}</h3>
      <img class="inline" src="https://openweathermap.org/img/w/${
        lastForecastObj.weather[0].icon
      }.png" alt="${lastForecastObj.weather[0].description}" title="${
      lastForecastObj.weather[0].description
    }">
      <p>Temp: ${Math.round(lastForecastObj.main.temp)}&deg C</p>
      <p>Wind: ${lastForecastObj.wind.speed} m/s</p>
      <p>Humidity: ${lastForecastObj.main.humidity}%</p>
    </div>     
    `);
  }
}

//Populate the right-hand-side area with the places of interest, each being a link to the wikidata pagecd
function populatePOIAside(poiArray) {
  $(".city-link").remove();

  for (var poi of poiArray) {
    poiName = poi.name
    if (poiName.length > 40) {
      poiName = poiName.substring(0,37) + "...";
    }
    asideContainer.append(`
    <a class="city-link" href="https://www.wikidata.org/wiki/${poi.wikidata}" target="_blank">${poiName}</a>
    `);
  }
  asideContainer.prepend(`<h3 class="city-link">Places to see:</h3>`);
}

function renderMap(lon, lat) {
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

    L.marker([lat, lon])
      .addTo(map)
      .bindPopup(
        `<h3>${poiTitle}</h3>  <button class="dropdown-btn" onclick="addPoiToLocalStorage('${poiTitle}')">Add my wish list</button>`
      );
  }
}

//Remove POI from local storage, if no POI's left, city gets removed too.
function removeFromLocalStorage(poiName) {
  let wishList = JSON.parse(localStorage.getItem("wishlist"));

  for (const city in wishList) {
    const index = wishList[city].indexOf(poiName);
    if (index > -1) {
      wishList[city].splice(index, 1);
    }

    if (wishList[city].length === 0) delete wishList[city];
  }

  localStorage.setItem("wishlist", JSON.stringify(wishList));
  populateWishListDropDown();
}

//Save poi and city to local storage.
function addPoiToLocalStorage(poiName) {
  if (!localStorage.getItem("wishlist")) {
    localStorage.setItem("wishlist", JSON.stringify({}));
  }

  let wishList = JSON.parse(localStorage.getItem("wishlist"));
  wishList[cityName]
    ? wishList[cityName].push(poiName)
    : (wishList[cityName] = [poiName]);

  localStorage.setItem("wishlist", JSON.stringify(wishList));
  populateWishListDropDown();
}

function populateWishListDropDown() {
  var citiesWishList = JSON.parse(localStorage.getItem("wishlist"));

  dropDownWishList.empty();

  if (citiesWishList != null) {
    for (var city in citiesWishList) {
      const cityPoiList = citiesWishList[city];
      let poisMarkup = "";
      cityPoiList.forEach((poi) => {
        poisMarkup += `<li id='${poi}'>${poi} <button class="dropdown-btn" onclick='removeFromLocalStorage("${poi}")'>remove</button></li>`;
      });

      dropDownWishList.prepend(`
      <div id='${city}' >
        <button class="dropdown-btn">${city}</button>
        <ul class="dropdown-item" ">${poisMarkup}</ul>
      `);
    }
  }
}
