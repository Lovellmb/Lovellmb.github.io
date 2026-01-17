var lat = 0;
var long = 0;
var timezone = "";
var openMeteo = "";
var WeatherGov = "";
var zip = "";
var historyIndex = 0;
var zipSearch = "";
var dateSearch = "";

/* -------------------- COORDS -------------------- */
function getCoords(zipcode) {
    $.ajax({
        url: "https://geocoding-api.open-meteo.com/v1/search",
        method: "GET",
        data: {
            name: zipcode,
            count: 1,
            language: "en",
            format: "json"
        }
    }).done(function (data) {
        if (data.results) {
            zip = zipcode;
            lat = data.results[0].latitude;
            long = data.results[0].longitude;
            timezone = data.results[0].timezone;

            $("#apiResponse").show();
            $("#zipWarning").hide();

            getOpenMeteo(lat, long, timezone);
        } else {
            $("#zipWarning").show();
        }
    });
}

/* -------------------- OPEN METEO -------------------- */
function getOpenMeteo(lat, long, timezone) {
    $.ajax({
        url: "https://api.open-meteo.com/v1/forecast",
        method: "GET",
        data: {
            latitude: lat,
            longitude: long,
            timezone: timezone,
            daily: "temperature_2m_max,wind_speed_10m_max,precipitation_probability_max",
            temperature_unit: "fahrenheit",
            wind_speed_unit: "mph"
        }
    }).done(function (data) {
        openMeteo = JSON.stringify(data);
        displayOpenMeteo(data);
        getMapCoords(lat, long);
    });
}

/* -------------------- WEATHER ICON -------------------- */
function getPrecipIconURL(chance) {
    if (chance <= 20) return "https://i.imgur.com/6YVQpVg.png";
    if (chance <= 40) return "https://i.imgur.com/Jz1PZ2T.png";
    return "https://i.imgur.com/W4KXKJp.png";
}

/* -------------------- DISPLAY OPEN METEO -------------------- */
function displayOpenMeteo(data) {
    for (let i = 1; i <= 7; i++) {
        $("#High" + i + "W1").html(data.daily.temperature_2m_max[i - 1] + "°F");
        $("#Wind" + i + "W1").html(data.daily.wind_speed_10m_max[i - 1] + " mph");

        let chance = data.daily.precipitation_probability_max[i - 1];
        $("#Pre" + i + "W1").html(chance + "% <img class='cell-icon' src='" + getPrecipIconURL(chance) + "'>");
    }
}

/* -------------------- WEATHER.GOV -------------------- */
function getMapCoords(lat, long) {
    $.ajax({
        url: `https://api.weather.gov/points/${lat},${long}`,
        method: "GET"
    }).done(function (data) {
        getWeatherGov(data.properties.gridX, data.properties.gridY);
    });
}

function getWeatherGov(gridX, gridY) {
    $.ajax({
        url: `https://api.weather.gov/gridpoints/ILN/${gridX},${gridY}/forecast`,
        method: "GET"
    }).done(function (data) {
        WeatherGov = JSON.stringify(data);
        displayWeatherGov(data);
        getGemini();
    });
}

/* -------------------- DISPLAY WEATHER.GOV -------------------- */
function displayWeatherGov(data) {
    for (let i = 1; i <= 7; i++) {
        const period = data.properties.periods[(i * 2) - 2];
        $("#Day" + i).text(period.name);
        $("#High" + i + "W2").html(period.temperature + "°F");
        $("#Wind" + i + "W2").html(period.windSpeed);

        let chance = period.probabilityOfPrecipitation.value ?? 0;
        $("#Pre" + i + "W2").html(chance + "% <img class='cell-icon' src='" + getPrecipIconURL(chance) + "'>");
    }
}

/* -------------------- GEMINI (CLOUDFLARE WORKER) -------------------- */
function getGemini() {
    $("#gptResponse").html("Waiting for AI response...");

    fetch("https://YOUR-WORKER-NAME.workers.dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [
                {
                    role: "user",
                    parts: [{
                        text:
                            "Summarize the following weather data in HTML.\n\n" +
                            "OpenMeteo:\n" + openMeteo +
                            "\n\nWeather.gov:\n" + WeatherGov
                    }]
                }
            ]
        })
    })
    .then(res => res.json())
    .then(data => {
        displayGemini(data);
        addLog(data);
    })
    .catch(() => $("#gptResponse").html("AI unavailable"));
}

/* -------------------- DISPLAY GEMINI -------------------- */
function displayGemini(data) {
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    $("#gptResponse").html(text || "No summary available");
}

/* -------------------- LOCAL STORAGE LOGGING -------------------- */
function addLog(gemini) {
    const logs = JSON.parse(localStorage.getItem("weatherLogs") || "[]");

    logs.unshift({
        timestamp: new Date().toISOString(),
        request: zip,
        openmeteo: openMeteo,
        weathergov: WeatherGov,
        gemini: gemini
    });

    localStorage.setItem("weatherLogs", JSON.stringify(logs));
}

function getLog(index) {
    const logs = JSON.parse(localStorage.getItem("weatherLogs") || "[]");
    if (!logs[index]) return;

    $("#timestamp").text(logs[index].timestamp);
    $("#request").text(logs[index].request);

    displayOpenMeteo(JSON.parse(logs[index].openmeteo));
    displayWeatherGov(JSON.parse(logs[index].weathergov));
    displayGemini(logs[index].gemini);
}

function getIndex(zip, date, start, move) {
    const logs = JSON.parse(localStorage.getItem("weatherLogs") || "[]");

    for (let i = start; i >= 0 && i < logs.length; i += move) {
        const matchZip = !zip || logs[i].request === zip;
        const matchDate = !date || logs[i].timestamp.includes(date);

        if (matchZip && matchDate) {
            historyIndex = i;
            getLog(i);
            return;
        }
    }
}

/* -------------------- UI -------------------- */
$(document).ready(function () {
    $("#addressButton").click(() => getCoords($("#addressTextBox").val()));

    $("#historyButton").click(() => {
        zipSearch = $("#zipcodeTextBox").val();
        dateSearch = $("#dateTextBox").val();
        historyIndex = 0;
        getIndex(zipSearch, dateSearch, 0, 1);
    });

    $("#forwardButton").click(() => getIndex(zipSearch, dateSearch, historyIndex + 1, 1));
    $("#backwardButton").click(() => getIndex(zipSearch, dateSearch, historyIndex - 1, -1));
});
