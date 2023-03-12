const openMapAPIKey =
  "5ae2e3f221c38a28845f05b6ba80233b310c7a56ad48628d52fcdbe3";
const weatherAPIKey = "6ca9f0eebaa8221a45b6dae6209aad2c";
const mapTilerKey = "NtCHCLnEB2T8gRRbY03N";
const searchInput = $("#city");
const addButton = $("#add-btn");
const asideContainer = $(".aside");
const weatherCardWrapper = $("#five-day");
const dropDownWishList = $("#dropdown-menu");
const cityNewsSection = $("#categoryGrid");
const resultsSection = $("#results-section");
const modalTitle = $(".modal-title");
const selectedCategory = $("#select-category");
const todayDate = moment();

var cityName = "";
var openMapKinds = "theatres_and_entertainments"; //accomodations, architecture, museums, theatres_and_entertainments, historic, tourist_facilities
var openMapLimit = "23";
var openMapRadius = "5000"; //meters
var map;

init();

//Capture input data and pass it to next function
function init() {
  $("#search-city").on("submit", function (event) {
    event.preventDefault();
    cityName = searchInput.val();
    getCoordinates(cityName);
  });
  populateWishListDropDown();
}

//Get coordinates for the searched for place using OpenTrip API
function getCoordinates(cityName) {
  //Check if there is a town name provided, request the data from the API and call functions to display it
  if (cityName) {
    var lon = "";
    var lat = "";

    var url = `https://api.opentripmap.com/0.1/en/places/geoname?name=${cityName}&apikey=${openMapAPIKey}`;

    $.get(url).then(function (coorData) {
      if (coorData.status === "OK") {
        lon = coorData.lon;
        lat = coorData.lat;

        searchInput.val("");
        getPOI(lon, lat);
        getWeather(lon, lat);
        renderMap(lon, lat);
      }
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
            xid: poi.properties.xid,
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

function setPoiCategory(poiCategory) {
  openMapKinds = poiCategory;
  selectedCategory.html(`${poiCategory.replaceAll("_", " ")}
  <img
    class="dropdown-arrow"
    src="./assets/images/arrow-down-3101.svg"
  />`);
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

function renderMap(lon, lat) {
  //Clear map if it needs to display further results
  if (map != null) {
    map.remove();
  }

  mapZoomLocation = [lat, lon];
  zoomLevel = 15; // Higher number = larger zoom.
  map = L.map("map").setView(mapZoomLocation, zoomLevel);

  L.tileLayer(
    `https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=${mapTilerKey}`,
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  ).addTo(map);
  modalTitle.text(`Discover ${cityName} with City Wonderer!`);
}

//Add Markers to a map, acceps objects array from API
function addMarkersToMap(POIs) {
  let markerNum = 1;
  for (const poi of POIs) {
    const lat = poi.geometry.coordinates[1];
    const lon = poi.geometry.coordinates[0];
    const poiTitle = poi.properties.name;

    const myIcon = L.divIcon({
      html: `<h4 class="map-marker">${markerNum}</h4>`,
      className: 'my-icon'
    });

    L.marker([lat, lon], { icon: myIcon })
      .addTo(map)
      .bindPopup(
        `<button class="add-to-poi-btn" onclick="addPoiToLocalStorage('${poiTitle}')">${poiTitle} <h1>&#x2764;</h1></button>`
      );

    markerNum++;
  }
}

//Populate the right-hand-side area with the places of interest, each being a link to the wikidata page
//We using free api, which limits us to 10 API calls per second,
//therefore we applyng throttling  in this function
function populatePOIAside(poiArray) {
  asideContainer.html(""); //Empty previous data.

  for (var i = 0; i < poiArray.length; i++) {
    const poi = poiArray[i];
    poiName = poi.name;

    const url = `https://api.opentripmap.com/0.1/ru/places/xid/${poi.xid}?apikey=${openMapAPIKey}`;

    setTimeout(
      (function (i) {
        return function () {
          $.get(url).then(function (xidData) {
            if (poiName.length > 40) {
              poiName = poiName.substring(0, 37) + "...";
            }
            asideContainer.append(`
            <div class="poi-card">
              <h4> 
                ${i + 1}.${xidData.name}
              </h4>
              <img src="${
                xidData.preview
                  ? xidData.preview.source
                  : "/assets/images/image-not-found-icon.svg"
              }" class="poi-card_img-top" alt="${xidData.name}">
              <div class="poi-card_body">
                ${
                  xidData.wikipedia_extracts
                    ? xidData.wikipedia_extracts.text
                    : "No description found"
                }  
              </div>
            </div>
            <hr/>
          `);
          });
        };
      })(i),
      i * 300
    ); // delay each API call by 300 milliseconds
  }
}

//Remove POI from local storage, if no POI's left, city gets removed too.
function removeFromLocalStorage(poiName, event) {
  event.stopPropagation();

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
  let wishList = JSON.parse(localStorage.getItem("wishlist")) || {};
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
        poisMarkup += `<li class="poi-li" id='${poi}'>
          ${poi}
          <button class="remove-poi-btn" onclick='removeFromLocalStorage("${poi}", event)'>&#10005</button>
         </li>`;
      });

      dropDownWishList.prepend(`
      <div class="wishlist" id='${city}' >
        <button onclick='getCoordinates("${city}")'>${city}</button>
        <hr>
        <ul class="dropdown-item" ">${poisMarkup}</ul>
      </div>
      `);
    }
  }
}
