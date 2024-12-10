const ApiKey = "cd8161af3d4a4608f689e4dc5f2613dc"; // Replace with your OpenWeatherMap API key

// Preload images
const preloadImages = [
    'https://images.pexels.com/photos/2043035/pexels-photo-2043035.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.unsplash.com/photo-1561470508-fd4df1ed90b2?q=80&w=876&auto=format&fit=crop&ixlib=rb-4.0.3',
    'https://images.unsplash.com/photo-1561553543-e4c7b608b98d?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.0.3',
    'https://images.unsplash.com/photo-1617141869037-a0db4d26b6af?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.0.3',
    'https://images.unsplash.com/photo-1418985991508-e47386d96a71?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.0.3'
];

let loadedImages = 0;

// Track when all images are loaded
preloadImages.forEach((src) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        loadedImages++;
        if (loadedImages === preloadImages.length) {
            document.body.classList.add('background-ready');
        }
    };
});


// Initialization function
function initPage() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoordinates(latitude, longitude); // Fetch weather by geolocation
            },
            () => {
                showNotification("Geolocation not available or denied.");
                handleFallback(); // Handle fallback to default location or Livingstone
            }
        );
    } else {
        showNotification ("Geolocation not supported.");
        handleFallback(); // Handle fallback to default location or Livingstone
    }
}

// Handle fallback logic
function handleFallback() {
    const defaultLocation = localStorage.getItem("defaultLocation");

    if (defaultLocation) {
        showNotification(`Your current default city is ${defaultLocation}`);
        fetchWeatherByCity(defaultLocation); // Fetch weather for the default location
    } else {
        showNotification("No default location set. Falling back to Livingstone.");
        fetchWeatherByCity("Livingstone"); // Fallback to Livingstone
    }
}

// Fetch weather by geolocation coordinates
function fetchWeatherByCoordinates(lat, lon) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${ApiKey}&units=metric`;

    fetch(apiUrl)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error fetching geolocation-based weather.");
            }
            
            
            return response.json();
        })
        .then((data) => {
            displayCurrentWeather(data.name, data); // Display weather
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("Unable to fetch weather data for your location. Checking fallback options.");
            handleFallback(); // If geolocation fetch fails, check fallback options
        });
}

// Fetch weather by city name
function fetchWeatherByCity(cityName) {
    
    if (!navigator.onLine) {
            showNotification('No network connection. Please check your Internet');
            hideLoader();
            return;
        }
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${ApiKey}&units=metric`;

    fetch(apiUrl)
        .then((response) => {
            if (!response.ok) {
                showNotification(`Error fetching weather data for ${cityName}`);
            }
            
            
            return response.json();
        })
        .then((data) => {
            displayCurrentWeather(cityName, data); // Display weather
        })
        .catch((error) => {
            console.error("Error:", error);
            showNotification('Unable to fetch weather data. Please try again later.');
        });
}

// Display current weather on the page
function displayCurrentWeather(cityName, data) {
    const weatherDisplay = document.getElementById("dailyDisplay");
    weatherDisplay.innerHTML = `
        <h2>Weather in ${cityName}</h2>
        <p><i class="fas fa-thermometer-half"></i> Temperature: ${data.main ? data.main.temp : "N/A"}°C</p>
        <p><i class="fas fa-cloud"> </i>Condition: ${data.weather ? data.weather[0].description : "N/A"}</p>
        <p><i class="fas fa-tint"> </i> Humidity: ${data.main ? data.main.humidity : "N/A"}%</p>
        <p><i class="fas fa-wind"></i> Wind Speed: ${data.wind ? data.wind.speed : "N/A"} m/s</p>
    `;
}

// Run the initialization function on page load
document.addEventListener("DOMContentLoaded", initPage);

// Redirect to main page
function redirectToMain() {
    window.location.href = "kumusanza .html";
    showNotification ('Redirecting...')
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
    });
});

// Helper function to close all sections
function closeAllSections() {
    document.getElementById("helpInfo").style.display = "none";
    document.getElementById("aboutInfo").style.display = "none";
    document.getElementById("contactInfo").style.display = "none";
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

function showNotification(message) {
    const notificationContainer = document.getElementById('notificationContainer');
    const notificationMessage = document.getElementById('notificationMessage');

    notificationMessage.textContent = message;
    notificationContainer.classList.add('show'); // Show the notification

    // Hide the notification after 3 seconds
    setTimeout(() => {
        notificationContainer.classList.remove('show'); // Hide the notification
    }, 3000);
}
