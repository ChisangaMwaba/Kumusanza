//OpenWeatherMap API key
const weatherApiKey = 'cd8161af3d4a4608f689e4dc5f2613dc';

// Default settings for units and location
const unitsConfig = {
    pressure: localStorage.getItem('pressureUnit') || 'metric',
    temperature: localStorage.getItem('temperatureUnit') || 'metric',
    windSpeed: localStorage.getItem('windSpeedUnit') || 'metric',
};

//Constants and global 
let cityName = '';
let defaultLocation = localStorage.getItem('defaultLocation') || 'Livingstone';
let language = localStorage.getItem('language') || 'en';
let favourites = JSON.parse(localStorage.getItem('favourites')) || [];
let temperatureUnit = localStorage.getItem('temperatureUnit') || 'metric';
let windSpeedUnit = localStorage.getItem('windSpeedUnit') || 'metric';


document.addEventListener('DOMContentLoaded', init);

 // Initialization tasks
function init() {
    updateFavouritesList();
    startClock();
}


function translate(keyword) {
    return translations[language] && translations[language][keyword] ? translations[language][keyword] : keyword;
}



document.addEventListener('DOMContentLoaded', async () => {
    // Render cities
    renderCities();

    // Set up event listeners for unit toggles
    document.getElementById('imperialBtn')?.addEventListener('click', setImperialUnits);
    document.getElementById('metricBtn')?.addEventListener('click', setMetricUnits);

    const unitsLink = document.getElementById("unitsLink");
    unitsLink?.addEventListener('click', toggleUnits);

    // Get user location (await if it's asynchronous)
    await getUserLocation();

    // Home button event listener
    const homeButton = document.getElementById('homeButton');
    homeButton?.addEventListener('click', goHome);

    // Hamburger menu event listener
    const menuIcon = document.getElementById('menu-icon');
    const menu = document.getElementById('menu');
    menuIcon?.addEventListener('click', toggleMenu);

    // Favourites event listeners
    const favouritesList = document.getElementById('favourites-list');
    favouritesList?.addEventListener('click', toggleListOfFavourites);

    // Cities dropdown event listener
    const citiesLink = document.getElementById('citiesLink');
    citiesLink?.addEventListener('click', toggleCities);

    // Close dropdown when clicking outside
    document.addEventListener('click', event => {
        const citiesDropdown = document.getElementById('citiesDropdown');
        if (citiesDropdown && !event.target.closest('#citiesDropdown') && !event.target.closest('#citiesLink')) {
            citiesDropdown.style.display = 'none';
        }
    });
});
// Toggle hamburger menu
function toggleMenu() {
    menu.classList.toggle("show");

    if (menu.classList.contains("show")) {
        // Listen for clicks outside the menu to close it
        window.addEventListener('click', outsideClickHandler);
    } else {
        // Remove the outside click listener
        window.removeEventListener('click', outsideClickHandler);
    }
}

function outsideClickHandler(event) {
    const menuIcon = document.getElementById('menu-icon'); // Ensure it is accessible here
    if (!event.target.closest('#menu') && event.target !== menuIcon) {
        menu.classList.remove("show");
        window.removeEventListener('click', outsideClickHandler);
    }
}


//Function to fetch current weather
async function getWeather(cityName) {
    const cityWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${weatherApiKey}&units=${temperatureUnit}&lang=${language}`;

    try {
        showLoader();

        // Check for network connection
        if (!navigator.onLine) {
            showNotification('No network connection. Please check your Internet');
            hideLoader();
            return;
        }

        const response = await fetch(cityWeatherUrl);

        if (!response.ok) {
            showNotification(`Error fetching weather data for ${cityName}`);
            hideLoader();
            return;
        }

        const data = await response.json();

        // Set the global cityName first
        cityName = data.name;

        // Get the main weather condition (e.g., 'Clear', 'Rain', 'Clouds')
        const weatherCondition = data.weather[0].main;
        updateContainerBackground(weatherCondition);

        // Display the current weather
        displayCurrentWeather(cityName, data);

        // Proceed to fetch the 5-day forecast if coordinates are available
        if (data.coord) {
            const { lat, lon } = data.coord;
            await fetch5DayForecast(lat, lon);
        } else {
            throw new Error("Coordinates not available for the selected city.");
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Unable to fetch weather data. Please try again later.');
    } finally {
        hideLoader();
    }
}

let currentWeatherData = null;
// Function to display current weather
function displayCurrentWeather(cityName, data) {
    cityName = data.name;
    currentWeatherData = data;
    setTimezoneOffset(data.timezone);
    const weatherDisplay = document.getElementById('weatherDisplay');

    // Check if the necessary data is available
    if (!data || !data.weather || !data.main) {
        weatherDisplay.innerHTML = `<p>${translate('errorFetchingData')}</p>`;
        return;
    }
    const iconCode = data.weather[0]?.icon || '';
    const iconUrl = iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : '';
    const windSpeed = windSpeedUnit === 'metric' ? 'm/s' : 'mph';
    const temperatureSymbol = temperatureUnit === 'metric' ? '°C' : '°F';
    const pressureUnit = temperatureUnit === 'metric' ? 'hPa' : 'inHg';
    const pressureValue = temperatureUnit === 'metric'
        ? data.main.pressure
        : (data.main.pressure / 33.8639).toFixed(2); // Convert pressure to inHg if imperial

    // Helper function to determine wind direction
    const getWindDirection = (deg) => {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return directions[Math.round(deg / 45) % 8];
    };

    // Extract additional data
    const feelsLike = data.main?.feels_like || 'N/A';
    const cloudiness = data.clouds?.all || 'N/A';
    const windDirection = data.wind?.deg !== undefined ? getWindDirection(data.wind.deg) : 'N/A';
    const sunrise = data.sys?.sunrise ? new Date(data.sys.sunrise * 1000).toLocaleTimeString() : 'N/A';
    const sunset = data.sys?.sunset ? new Date(data.sys.sunset * 1000).toLocaleTimeString() : 'N/A';
    // Update the weatherDisplay container
    weatherDisplay.innerHTML = `
    <h3>${translate('currentWeather')} ${cityName}</h3>
    <div class="weather-details">
        <span class="top-display">
            <span class="weather-icon">
                <img src="${iconUrl}" alt="Weather icon" />
            </span>
            <span class="temperature">${data.main.temp}${temperatureSymbol}</span>
        </span>
    </div>
    <div class="weather-details"><div class = "subject">${translate('feelsLike')}:</div> <div class = "object">${feelsLike}${temperatureSymbol}</div></div>
    <div class="weather-details"><div class = "subject">${translate('condition')}:</div> <div class = "object">${data.weather[0]?.description || 'N/A'}</div></div>
    <div class="weather-details"><div class = "subject">${translate('humidity')}:</div> <div class = "object">${data.main?.humidity}%</div></div>
    <div class="weather-details"><div class = "subject">${translate('pressure')}:</div> <div class = "object">${pressureValue} ${pressureUnit}</div></div>
    <div class="weather-details"><div class = "subject">${translate('cloudiness')}:</div> <div class = "object">${cloudiness}%</div></div>
    <div class="weather-details"><div class = "subject">${translate('windSpeed')}:</div> <div class = "object">${data.wind?.speed} ${windSpeed}</div></div>
    <div class="weather-details"><div class = "subject">${translate('windDirection')}:</div> <div class = "object">${windDirection}</div></div>
    <div class="weather-details"><div class = "subject">${translate('sunrise')}:</div> <div class = "object">${sunrise}</div></div>
    <div class="weather-details"><div class = "subject">${translate('sunset')}:</div> <div class = "object">${sunset}</div></div>
    <div class="weather-details"><div class = "subject">${translate('localTime')}:</div> <div class = "object">${cityTime}</div></div>
    `;
}


// Fetch 5-day forecast in 3-hour intervals using city coordinates (lat, lon)
async function fetch5DayForecast(lat, lon) {
    const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=${temperatureUnit}&lang=${language}`;

    try {
        const response = await fetch(forecastApiUrl);
        if (!response.ok) {
            throw new Error('Error fetching forecast data');
        }

        const forecastData = await response.json();
        const dailySummaries = summarizeDailyForecasts(forecastData.list);
        display5DayForecast(dailySummaries);

        const temperatures = extractTemperatureData(forecastData);
        displayWeatherChart(temperatures);
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Unable to fetch forecast data. Please try again later.');
    }
}

// Summarize hourly forecasts into daily summaries with hourly details
function summarizeDailyForecasts(forecastList) {
    const dailyData = {};

    forecastList.forEach(forecast => {
        const forecastDate = new Date(forecast.dt * 1000);
        const date = forecastDate.toLocaleDateString();
        const time = forecastDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (!dailyData[date]) {
            dailyData[date] = {
                hours: [],
                tempMax: forecast.main.temp,
                tempMin: forecast.main.temp,
                weatherDescription: forecast.weather[0].description,
                count: 0
            };
        }

        dailyData[date].hours.push({
            time: time,
            temp: forecast.main.temp,
            weatherDescription: forecast.weather[0].description,
            icon: forecast.weather[0].icon
        });

        // Update max and min temperature for the day
        dailyData[date].tempMax = Math.max(dailyData[date].tempMax, forecast.main.temp);
        dailyData[date].tempMin = Math.min(dailyData[date].tempMin, forecast.main.temp);
        dailyData[date].count++;
    });

    return dailyData;
}

// Function to display the 5-day forecast with hourly scrolling for each day
function display5DayForecast(dailySummaries) {
    const temperatureSymbol = unitSymbols.temperature[temperatureUnit]; // Dynamically reflect the user's unit preference

    const forecastDisplay = document.getElementById('forecastDisplay');
    forecastDisplay.innerHTML = `<h3>${translate('fiveDayForecast')}</h3>`;

    Object.keys(dailySummaries).forEach(date => {
        const dailyForecast = dailySummaries[date];
        const dayContainer = document.createElement('div');
        dayContainer.classList.add('day-container');

        const dayHeader = document.createElement('h4');
        dayHeader.textContent = date;
        dayContainer.appendChild(dayHeader);

        const hourlyForecast = document.createElement('div');
        hourlyForecast.classList.add('hourly-forecast');

        dailyForecast.hours.forEach(hour => {
            const forecastItem = document.createElement('div');
            forecastItem.classList.add('forecast-item');

            // Create elements for better security and flexibility
            const timeElement = document.createElement('p');
            timeElement.innerHTML = `<strong>${hour.time}</strong>`;

            const forecastIcon = document.createElement('img');
            forecastIcon.src = `https://openweathermap.org/img/wn/${hour.icon}@2x.png`;
            forecastIcon.alt = hour.weatherDescription;

            const iconContainer = document.createElement('span');
            iconContainer.classList.add('forecast-icon');
            iconContainer.appendChild(forecastIcon);

            const tempElement = document.createElement('span');
            tempElement.classList.add('hour-temp');
            tempElement.textContent = `${hour.temp || 'N/A'}${temperatureSymbol}`;

            const hourTop = document.createElement('span');
            hourTop.classList.add('hour-top');
            hourTop.appendChild(iconContainer);
            hourTop.appendChild(tempElement);

            const descriptionElement = document.createElement('p');
            descriptionElement.textContent = hour.weatherDescription;

            // Append all elements to the forecast item
            forecastItem.appendChild(timeElement);
            forecastItem.appendChild(hourTop);
            forecastItem.appendChild(descriptionElement);

            hourlyForecast.appendChild(forecastItem);
        });

        dayContainer.appendChild(hourlyForecast);
        forecastDisplay.appendChild(dayContainer);
    });
}

// Extract temperature data for the chart
function extractTemperatureData(forecastData) {
    const temperatures = {
        labels: [], // Time labels (dates)
        data: [] // Temperature data
    };

    forecastData.list.forEach(forecast => {
        const forecastDate = new Date(forecast.dt * 1000);
        const date = forecastDate.toLocaleDateString();
        const temp = forecast.main.temp;
        
        temperatures.labels.push(date);
        temperatures.data.push(temp);
    });

    return temperatures;
}

// Declare the chart instance globally
let forecastChart = null;

function displayWeatherChart(temperatures, temperatureSymbol) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
var temperatureSymbol = temperatureUnit === 'metric' ? '°C' : '°F';
    // Destroy the existing chart if it exists
    if (forecastChart && typeof forecastChart.destroy === 'function') {
        forecastChart.destroy();
    }

    // Dynamically calculate the Y-axis range
    const minTemp = Math.min(...temperatures.data) - 5;
    const maxTemp = Math.max(...temperatures.data) + 5;

    // Ensure the zoom plugin is registered
    if (typeof Chart.Zoom === 'undefined') {
        Chart.register(ChartZoom);
    }

    // Create a new chart with zoom and pan options
    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: temperatures.labels,
            datasets: [{
                label: `${translate('temperature')} (${temperatureSymbol})`,
                data: temperatures.data,
                borderColor: '#00796b',
                backgroundColor: 'rgba(0, 121, 107, 0.2)',
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: `${translate('temperature')} (${temperatureSymbol})`
                    },
                    min: minTemp,
                    max: maxTemp
                }
            },
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy', // Allow panning both horizontally and vertically
                        threshold: 10 // Minimum movement distance for panning
                    },
                    zoom: {
                        wheel: {
                            enabled: true, // Enable zooming with the mouse wheel
                            speed: 0.05 // Adjust zoom speed (lower is slower)
                        },
                        pinch: {
                            enabled: true, // Enable pinch-to-zoom for touch screens
                            mode: 'xy'
                        },
                        drag: {
                            enabled: true, // Enable drag-to-zoom
                            backgroundColor: 'rgba(0, 121, 107, 0.3)' // Optional: highlight drag area
                        },
                        mode: 'xy', // Allow zooming both horizontally and vertically
                        limits: {
                            x: { min: 'original', max: 'original' }, // Prevent excessive zoom out
                            y: { min: minTemp - 10, max: maxTemp + 10 }
                        }
                    }
                }
            }
        }
    });
}
// Function to get the user's location using async/await
async function getUserLocation() {
    try {
        showLoader(); // Show the loader while getting the location

        if (!navigator.geolocation) {
            throw new Error("Geolocation is not supported by this browser.");
        }

        const position = await getCurrentPositionAsync();
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        console.log(`User location: Latitude = ${lat}, Longitude = ${lon}`);
        await fetchWeatherByCoordinates(lat, lon);
    } catch (error) {
        console.error('Geolocation error:', error);
        showNotification("Unable to retrieve your location. Showing weather for default city.");
        await getWeather(defaultLocation); // Fallback to default city if geolocation fails
    } finally {
        hideLoader(); // Hide loader after fetching weather or error handling
    }
}

// Helper function to wrap geolocation.getCurrentPosition() in a Promise
async function getCurrentPositionAsync() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

// Function to fetch weather data by coordinates using async/await
async function fetchWeatherByCoordinates(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;

    console.log(`Fetching weather data from: ${url}`);

    try {
        const response = await fetch(url);

        // Check if the response is successful (status code 200)
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${response.status} - ${errorData.message}`);
        }

        const data = await response.json();
        console.log("Weather data received:", data);

        // Update the global cityName variable
        cityName = data.name;

        // Display the current weather with the updated cityName
        displayCurrentWeather(cityName, data);
    } catch (error) {
        console.error("Error fetching weather data:", error);
        showNotification("Failed to fetch weather data. Please check your internet connection.");

        // Fallback to default location if the API call fails
        cityName = defaultLocation; // Update cityName with defaultLocation
        await getWeather(defaultLocation);
    } finally {
        hideLoader(); // Hide loader after weather data is fetched or an error occurs
    }
}

// Function to handle manual city search with async/await
async function fetchCityWeather() {
    const cityInput = document.getElementById('cityInput').value.trim();
    cityName = cityInput;

    if (cityInput) {
        try {
            showLoader(); // Display the loader
            await getWeather(cityInput); // Await the weather fetch
            hideLoader(); // Hide the loader after the fetch
        } catch (error) {
            console.error("Error fetching city weather:", error);
            showNotification("Unable to fetch weather data for the entered city.");
            hideLoader(); // Hide the loader in case of an error
        }
    } else {
        showNotification("Please enter a city name.");
    }

    // Clear the input field
    document.getElementById('cityInput').value = "";
}

// Add an event listener for the 'Enter' key
document.getElementById('cityInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        fetchCityWeather(); // Use the refactored function
    }
});

// Function to handle Home button with async/await
async function goHome() {
    const menu = document.getElementById('menu');
    if (menu) {
        menu.classList.remove("show"); // Hide the menu using class control
    }
    
    try {
        await getWeather(defaultLocation); // Wait for the weather data to be fetched
    } catch (error) {
        console.error('Error fetching default location weather:', error);
        showNotification('Unable to fetch weather data for the default location.');
    }
}

function toggleUnits(event) {
    event.preventDefault(); // Prevent the default link behavior

    const unitsDropdown = document.getElementById("unitsDropdown");
    const isVisible = unitsDropdown.style.display === "block";

    // Toggle visibility of the dropdown
    unitsDropdown.style.display = isVisible ? "none" : "block";

    // Add or remove the click outside handler based on visibility
    if (!isVisible) {
        document.addEventListener('click', outsideUnitsClickHandler);
    } else {
        document.removeEventListener('click', outsideUnitsClickHandler);
    }
}

// Handler for clicks outside the units dropdown
function outsideUnitsClickHandler(event) {
    const unitsDropdown = document.getElementById("unitsDropdown");
    const unitsLink = document.getElementById("unitsLink");

    // Close the dropdown if the click is outside the dropdown and not on the link
    if (!event.target.closest('#unitsDropdown') && event.target !== unitsLink) {
        unitsDropdown.style.display = "none";
        document.removeEventListener('click', outsideUnitsClickHandler);
    }
}



// Constants for unit symbols
const unitSymbols = {
    temperature: {
        metric: '°C',
        imperial: '°F'
    },
    windSpeed: {
        metric: 'm/s',
        imperial: 'mph'
    },
    pressure: {
        metric: 'hPa',
        imperial: 'inHg'
}
}

// Function to set and save units to local storage, then update the weather display
async function setImperialUnits() {
    setTemperatureUnit('imperial'); // Set temperature unit to imperial
    setWindSpeedUnit('imperial'); 
    setPressureUnit('imperial');  
showNotification('Units succesfully set to Imperial');    
    await getWeather(cityName || defaultLocation); // Fetch updated weather data
}

async function setMetricUnits() {
    setTemperatureUnit('metric');   
    setWindSpeedUnit('metric');     
    setPressureUnit('metric');
    showNotification('Units succesfully set to Metric');
    await getWeather(cityName || defaultLocation);
}

// Function to update and save the temperature unit
function setTemperatureUnit(unit) {
    temperatureUnit = unit; // Ensure temperatureUnit is defined in your code
    localStorage.setItem('temperatureUnit', unit);
}

// Function to update and save the wind speed unit
function setWindSpeedUnit(unit) {
    windSpeedUnit = unit; // Ensure windSpeedUnit is defined in your code
    localStorage.setItem('windSpeedUnit', unit);
}

// Function to update and save the pressure unit
function setPressureUnit(unit) {
    pressureUnit = unit;
    localStorage.setItem('pressureUnit', unit);
}

/// Function to set the default location and show a notification
function setDefaultLocation(location) {
    defaultLocation = location;
    localStorage.setItem('defaultLocation', location);
      cityName = location;
    // Show the success notification that the city has been set as default
    showNotification(`${location} has been successfully set as default.`);
}


let clockInterval;
let timezoneOffset = 0; // Default value (in seconds)
let cityTime = ''; // Variable to store the city's local time

function updateClock() {
    const timeDisplay = document.getElementById('time');

    if (!timeDisplay) {
        console.error("Time display element not found.");
        return;
    }

    // Get the current UTC time
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;

    // Calculate the local time for the searched city
    const cityLocalTime = new Date(utcTime + timezoneOffset * 1000);
    const cityHours = String(cityLocalTime.getHours()).padStart(2, '0');
    const cityMinutes = String(cityLocalTime.getMinutes()).padStart(2, '0');
    const citySeconds = String(cityLocalTime.getSeconds()).padStart(2, '0');
    cityTime = `${cityHours}:${cityMinutes}:${citySeconds}`; // Store the city's local time

    // Display the current time in your location
    const localHours = String(now.getHours()).padStart(2, '0');
    const localMinutes = String(now.getMinutes()).padStart(2, '0');
    const localSeconds = String(now.getSeconds()).padStart(2, '0');

    // Update the time display in the div with id 'time'
    timeDisplay.textContent = `${localHours}:${localMinutes}:${localSeconds}`;
}

function startClock() {
    updateClock();
    clearInterval(clockInterval);
    clockInterval = setInterval(updateClock, 1000);
}

function setTimezoneOffset(offset) {
    timezoneOffset = offset;
    startClock();
}

document.addEventListener('DOMContentLoaded', () => {
    startClock();
});



// Toggle the favorites list visibility
function toggleListOfFavourites() {
    const listDiv = document.getElementById("listOfFavourites");
    listDiv.style.display = listDiv.style.display === 'none' ? 'block' : 'none';

    // Close the list if clicked outside
    document.addEventListener('click', (event) => {
    if (!event.target.closest('#listOfFavourites') && event.target.textContent !== "Favourites") {
        listDiv.style.display = "none";
    }
});

document.getElementById('addToFavouritesButton').addEventListener('click', () => {
    if (currentWeatherData) {
        addCurrentCityToFavourites(currentWeatherData);
    } else {
        showNotification("No city data available. Please fetch weather information first.");
    }
});
}

// Add the current city to the favorites list
async function addCurrentCityToFavourites() {
    if (typeof cityName !== 'undefined' && cityName && !favourites.includes(cityName)) {
        favourites.push(cityName);
        localStorage.setItem("favourites", JSON.stringify(favourites));
        updateFavouritesList();
        showNotification(`${cityName} has been added to favourites`);
    } else if (!cityName) {
        showNotification("City name is not defined. Please select a city first.");
    } else {
        showNotification(`${cityName} is already in favourites`);
    }
}

// Update the favorites list display
async function updateFavouritesList() {
    const listDiv = document.getElementById("listOfFavourites");
    listDiv.innerHTML = "";

    favourites.forEach((city) => {
        const cityElement = document.createElement("div");
        cityElement.textContent = city;

        // Add click event listener for fetching weather
        cityElement.addEventListener('click', () => getWeather(city));

        // Create the remove button
        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";

        // Add click event listener for removing the city directly
        removeButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent triggering cityElement click
            favourites = favourites.filter(c => c !== city);
            localStorage.setItem("favourites", JSON.stringify(favourites));
            updateFavouritesList(); 
            showNotification (`${city} has been removed from favourites`);
        });

        // Add city and remove button to the list
        cityElement.appendChild(removeButton);
        listDiv.appendChild(cityElement);
    });
}


// Initialize event listeners when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Event listener for the help toggle
    const helpButton = document.getElementById("helpButton");
    if (helpButton) {
        helpButton.addEventListener("click", toggleHelp);
    }

    // Event listener for the about toggle
    const aboutButton = document.getElementById("aboutButton");
    if (aboutButton) {
        aboutButton.addEventListener("click", toggleAbout);
    }

    // Event listener for the contact details toggle
    const contactButton = document.getElementById("contactButton");
    if (contactButton) {
        contactButton.addEventListener("click", toggleContactDetails);
    }

    // Event listener for the language toggle
    const languageButton = document.getElementById("languageButton");
    if (languageButton) {
        languageButton.addEventListener("click", toggleLanguages);
    }

    // Event listener for clicking anywhere outside to close the open sections
    window.addEventListener("click", function (event) {
        const helpInfo = document.getElementById("helpInfo");
        const aboutInfo = document.getElementById("aboutInfo");
        const contactInfo = document.getElementById("contactInfo");
        const languageDropdown = document.getElementById("languageDropdown");

        // Check if the click was outside of any open section and close them
        if (!event.target.closest('#helpButton') && helpInfo.style.display === "block") {
            helpInfo.style.display = "none";
        }
        if (!event.target.closest('#aboutButton') && aboutInfo.style.display === "block") {
            aboutInfo.style.display = "none";
        }
        if (!event.target.closest('#contactButton') && contactInfo.style.display === "block") {
            contactInfo.style.display = "none";
        }
        if (!event.target.closest('#languageButton') && languageDropdown.style.display === "block") {
            languageDropdown.style.display = "none";
        }
    });
});

// Helper function to close all sections
function closeAllSections() {
    document.getElementById("helpInfo").style.display = "none";
    document.getElementById("aboutInfo").style.display = "none";
    document.getElementById("contactInfo").style.display = "none";
    document.getElementById("languageDropdown").style.display = "none";
}

// Toggle help section visibility
function toggleHelp(event) {
    const helpInfo = document.getElementById("helpInfo");
    if (helpInfo.style.display === "block"){helpInfo.style.display = "none"} else{closeAllSections();
helpInfo.style.display="block";}
    event.stopPropagation(); // Prevent the click event from bubbling up to the window
}

// Toggle about section visibility
function toggleAbout(event) {
    const aboutInfo = document.getElementById("aboutInfo");
   if( aboutInfo.style.display === "block"){aboutInfo.style.display = "none"}else{ closeAllSections();
       aboutInfo.style.display = "block";}
    event.stopPropagation();
}

function toggleContactDetails(event) {
    const contactInfo = document.getElementById("contactInfo");
    
    // Check if the dropdown is already visible
    if (contactInfo.style.display === "block") {
        contactInfo.style.display = "none";
    } else {
        closeAllSections(); // Only close other sections if the dropdown is not open
        contactInfo.style.display = "block";
    }

    event.stopPropagation();
}

function toggleLanguages(event) {
    const languageDropdown = document.getElementById("languageDropdown");

    // Check if the dropdown is already visible
    if (languageDropdown.style.display === "block") {
        languageDropdown.style.display = "none";
    } else {
        closeAllSections(); // Only close other sections if the dropdown is not open
        languageDropdown.style.display = "block";
    }

    event.stopPropagation();
}

// Function to update the background based on weather condition
function updateContainerBackground(weatherCondition) {
    const container = document.getElementById('container');
    
    // A mapping of weather conditions to container classes
    const weatherClassMapping = {
        'Clear': 'sunny',
        'Rain': 'rainy',
        'Snow': 'snowy',
        'Thunderstorm': 'thunderstorm',
        'Clouds': 'cloudy'
    };
    
    // Default class if the weather condition is not in the mapping
    const classToAdd = weatherClassMapping[weatherCondition] || 'default';
    
    // Remove all weather-related classes
    container.className = container.className.replace(/\s*(sunny|rainy|snowy|thunderstorm|cloudy|default)\s*/g, ' ').trim();

    // Add the appropriate class for the weather condition
    container.classList.add(classToAdd);
}

// Select the loader element once and reuse it
const loaderElement = document.querySelector('.loader');

// Function to show the loader
function showLoader() {
    if (loaderElement) {
        loaderElement.style.display = 'flex';
    }
}

// Function to hide the loader
function hideLoader() {
    if (loaderElement) {
        loaderElement.style.display = 'none';
    }
}

// Set the selected language and save it in localStorage
function setLanguage(selectedLanguage) {
    // Update the language variable
    language = selectedLanguage;
    localStorage.setItem('language', language);

    // Update the displayed weather in the selected language
    getWeather(cityName || defaultLocation);

    // Hide the language dropdown after selection
    const languageDropdown = document.getElementById("languageDropdown");
    languageDropdown.style.display = "none";
}

// Attach click event listeners to language options
document.querySelectorAll('.language-option').forEach(option => {
    option.addEventListener('click', function() {
        const selectedLanguage = this.getAttribute('data-lang');
        setLanguage(selectedLanguage);
        showNotification(`Language switched to ${selectedLanguage.toUpperCase()}`);
    });
});

// Translation dictionary
const translations = {
    en: {
        temperature: "Temperature",
        localTime: "Local time",
        sunrise: "Sunrise",
        sunset: "Sunset",
        cloudiness: "Cloudiness",
        humidity: "Humidity",
        pressure: "Pressure",
        windSpeed: "Wind Speed",
        windDirection: "Wind Direction",
        feelsLike: "Feels Like",
        condition: "Condition",
        currentWeather: "Current Weather in",
        weeklyForecast: "Weekly Forecast",
        fiveDayForecast: "5 day Forecast"
            },
    fr: {
        temperature: "température",
        localTime: "heure locale",
        sunrise: "Lever du soleil",
        sunset: "Coucher du soleil",
        cloudiness: "Nuageux",
        humidity: "Humidité",
        pressure: "Pression",
        windSpeed: "Vitesse du vent",
        windDirection: "Direction du vent",
        feelsLike: "Ressenti",
        condition: "Condition",
        currentWeather: "Météo actuelle à",
        weeklyForecast: "Prévisions hebdomadaires",
        fiveDayForecast: "Prévisions sur 5 jours"
    }
};

//functions to translate js content
document.addEventListener("DOMContentLoaded", () => {
    const translations = {
        en: {
            homeButton: "Home",
            favouritesList: "Favourites",
            unitsLink: "Change Units",
            imperialBtn: "Imperial",
            metricBtn: "Metric",
            languageButton: "Languages",
            citiesLink: "Cities",
            addToFavouritesButton: "Add this City to Favorites",
            currentWeather: "Current Weather",
            weeklyForecast: "Weekly Forecast",
            aboutButton: "About Kumusanza",
            helpButton: "Help",
            contactButton: "Contact Us",
        },
        fr: {
            homeButton: "Accueil",
            favouritesList: "Favoris",
            unitsLink: "Changer les unités",
            imperialBtn: "Impérial",
            metricBtn: "Métrique",
            languageButton: "Langues",
            citiesLink: "Villes",
            addToFavouritesButton: "Ajouter cette ville aux favoris",
            currentWeather: "Météo actuelle",
            weeklyForecast: "Prévisions hebdomadaires",
            aboutButton: "À propos Kumusanza",
            helpButton: "Aide",
            contactButton: "Nous contacter",
        },
    };

    let currentLanguage = "en"; // Default language

    // Function to translate html page
    const translatePage = (lang) => {
        const elements = {
            homeButton: document.getElementById("homeButton"),
            favouritesList: document.getElementById("favourites-list"),
            unitsLink: document.getElementById("unitsLink"),
            imperialBtn: document.getElementById("imperialBtn"),
            metricBtn: document.getElementById("metricBtn"),
            languageButton: document.getElementById("languageButton"),
            citiesLink: document.getElementById("citiesLink"),
            addToFavouritesButton: document.getElementById("addToFavouritesButton"),
            aboutButton: document.getElementById("aboutButton"),
            helpButton: document.getElementById("helpButton"),
            contactButton: document.getElementById("contactButton"),
        };

        // Update text content based on translations
        Object.keys(elements).forEach((key) => {
            if (elements[key]) {
                elements[key].textContent = translations[lang][key];
            }
        });

        // Update other dynamic text (e.g., current weather section)
        document.querySelector("h3").textContent = translations[lang].currentWeather;
        document.querySelector("#forecastGraphContainer h3").textContent = translations[lang].weeklyForecast;
    };

    // Add event listeners for language options
    document.querySelectorAll(".language-option").forEach((option) => {
        option.addEventListener("click", () => {
            currentLanguage = option.dataset.lang;
            translatePage(currentLanguage);
        });
    });

    // Initialize with the default language
    translatePage(currentLanguage);
});


// Function to toggle the cities dropdown
function toggleCities() {
    var citiesDropdown = document.getElementById("citiesDropdown");
    // Toggle between showing and hiding the dropdown
    citiesDropdown.style.display = (citiesDropdown.style.display === "none" || citiesDropdown.style.display === "") ? "block" : "none";
}

// Close the cities dropdown if clicking outside of it
document.addEventListener('click', function(event) {
    const citiesDropdown = document.getElementById("citiesDropdown");
    const citiesLink = document.getElementById('citiesLink');
    
    // Close dropdown if click is outside of the cities dropdown and the cities link
    if (citiesDropdown && !event.target.closest('#citiesDropdown') && !event.target.closest('#citiesLink')) {
        citiesDropdown.style.display = 'none';
    }
});

// List of cities (this can be expanded or fetched from a server in the future)
const cities = [
   'Chikankata', 'Chirundu', 'Choma', 'Gwembe', 'Tara', 
    'Chisekesi', 'Kazungula', 'Livingstone', 'Mazabuka', 'Monze', 
    'Namwala', 'Pemba', 'Siavonga', 'Sinazongwe', 'Maamba', 'Sinazeze', 'Zimba','Lusaka'
];

// Function to render the list of cities
function renderCities() {
    const citiesList = document.getElementById('citiesList');
    citiesList.innerHTML = ''; // Clear existing list (if any)

    cities.forEach(city => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="city-name">${city}</span>
            <button class="set-default-btn">Set as Default</button>
        `;
        citiesList.appendChild(listItem);
    });
}

// Event delegation: Adding event listeners to dynamically generated elements
document.getElementById('citiesDropdown').addEventListener('click', function(event) {
    // Check if the clicked element is a city name or 'Set as Default' button
    if (event.target.classList.contains('city-name')) {
        const cityName = event.target.textContent;
        getWeather(cityName); // Fetch weather for the selected city
    } else if (event.target.classList.contains('set-default-btn')) {
        const cityName = event.target.previousElementSibling.textContent;
        setDefaultLocation(cityName); // Set selected city as default
    }
});

// Function to show the notification
function showNotification(message) {
    const notificationContainer = document.getElementById('notificationContainer');
    const notificationMessage = document.getElementById('notificationMessage');

    notificationMessage.textContent = message;
    notificationContainer.classList.add('show'); // Show the notification

    // Hide the notification after 5 seconds
    setTimeout(() => {
        notificationContainer.classList.remove('show'); // Hide the notification
    }, 5000); // Hide after 5 seconds
}