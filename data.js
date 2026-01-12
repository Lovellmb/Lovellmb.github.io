
var lat = 0;
var long = 0;
var timezone ="";
var openMeteo = "";
var openAI = "";
var WeatherGov = "";
var min = 0;
var zip = "";
var historyIndex = 0;
var zipSearch = "";
var dateSearch = "";

function getCoords(zipcode) {

    a=$.ajax({
	    url: 'https://geocoding-api.open-meteo.com/v1/search',
            method: "GET",
            data: {
                name: zipcode,
                count: "10",
                language: "en",
                format: "json"
		 }
      }).done(function(data) {
	if (data.results != null){
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
     }).fail(function(error){


     });
}

function getOpenMeteo(lat, long, timezone) {
    a=$.ajax({
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
      }).done(function(data) {
	getMapCoords(lat, long);
	displayOpenMeteo(data);
	openMeteo = JSON.stringify(data);
     }).fail(function(error){

     }); 

}
function getPrecipIconURL(chance) {
    if (chance <= 20) {
        return "https://w7.pngwing.com/pngs/318/505/png-transparent-weather-forecasting-computer-icons-cloud-public-domain-icons-cloud-orange-weather-forecasting.png";  // sunny
    } else if (chance <= 40) {
	return "https://w7.pngwing.com/pngs/166/384/png-transparent-cloud-sun-sunny-weather-weather-flat-icon-thumbnail.png"; //cloud
    } else {
        return "https://www.citypng.com/public/uploads/preview/cloud-rain-icon-transparent-png-701751695039291vvyoeptyc3.png";  // rain 
    }
}

function displayOpenMeteo(data) {
	if (data.daily.temperature_2m_max.length != 0){
        for (let i = 1; i <= 7; i++) {
	$("#High" + i + "W1").html(data.daily.temperature_2m_max[i-1] + "°F" +' <img class="cell-icon" src="https://i.pinimg.com/736x/0a/70/58/0a705876a6c34795d0ab4ec81ec0d5b1.jpg">');
        $("#Wind" + i + "W1").html(data.daily.wind_speed_10m_max[i-1] + " mph" +' <img class="cell-icon" src="https://media.lordicon.com/icons/wired/lineal/812-wind.svg">');
	let chance = data.daily.precipitation_probability_max[i-1];
	let iconURL = getPrecipIconURL(chance);
	
	$("#Pre" + i + "W1").html(chance + "%" + ' <img class="cell-icon" src="' + iconURL + '">');

        }} else {

        }
}

function getMapCoords(la, lo) {
	a=$.ajax({
            url: "https://api.weather.gov/points/" + la  + "," + lo,
	method: "GET"
      }).done(function(data) {
         var gridX = data.properties.gridX;
         var gridY = data.properties.gridY;
	getWeatherGov(gridX, gridY);
     }).fail(function(error){

     });
}

 function getWeatherGov(gridX, gridY) {
    a=$.ajax({
            url: "https://api.weather.gov/gridpoints/ILN/" + gridX  + "," + gridY + "/forecast",
            method: "GET"
      }).done(function(data) {
	displayWeatherGov(data);
        WeatherGov = JSON.stringify(data);
	getOpenAI();
}).fail(function(error){

     });

}

function displayWeatherGov(data){
   if (data.properties.periods != null){
        for (let i = 1; i <= 7; i++) {
	        $("#Day"+ i).text(data.properties.periods[(i*2) - 2].name);
		let period = data.properties.periods[(i*2) - 2];
		$("#High" + i + "W2").html(period.temperature + "°F" +' <img class="cell-icon" src="https://i.pinimg.com/736x/0a/70/58/0a705876a6c34795d0ab4ec81ec0d5b1.jpg"">');
		$("#Wind" + i + "W2").html(period.windSpeed +' <img class="cell-icon" src="https://media.lordicon.com/icons/wired/lineal/812-wind.svg">');
		let chanceW2 = period.probabilityOfPrecipitation.value ?? 0;
		let iconURL_W2 = getPrecipIconURL(chanceW2);
		$("#Pre" + i + "W2").html(chanceW2 + "%" + ' <img class="cell-icon" src="' + iconURL_W2 + '">');
        }
        } else {

        }
}

function getOpenAI() {
	console.log("starting ai");
    $("#gptResponse").html("waiting for ai response <div class='spinner-border spinner-border-sm'></div>");
    a=$.ajax({
            url: "final.php/openaiproxy",
            method: "POST",
	    data: {
	    endpoint: "responses",
            payload: JSON.stringify({
               model: "gpt-5",
               input: "Summarize the following weather data from open-meteo and weather.gov. First give a summary titled for the current day titled Today's Weather and then give a summary for each day in the upcoming week titled Weekly Forcast. Please mention only the max temperature, wind speed and percipitation chance. Format your response with html so it can be easily inserted into an existing html document. Openmeteo:" + openMeteo + "  Weather.gov: " + WeatherGov
              })
            }
      }).done(function(data) {
	displayOpenAI(data);
	addLog(data);
     }).fail(function(error){
	console.log("failed");
	console.log(error);

     });

}

function displayOpenAI(data){
     if (data.output != null){
        openAI = data.output[1].content[0].text;
        console.log(data);
        console.log("done");
        $("#gptResponse").html(openAI);
        } else {
        $("#gptResponse").html('<p>"Ai summary unavailbale at this time"</p>');
        }

}

function addLog(openAi) {
  a=$.ajax({
            url: "final.php/addLog",
            method: "POST",
            data: {
            request: zip,
	    openmeteo: openMeteo,
            weathergov: WeatherGov,
            openai: JSON.stringify(openAi)
            }
      })
}

function getLog(index) {
console.log("started getLog");
	a=$.ajax({
            url: "final.php/getlog",
            method: "GET"
	}).done(function(data) {
	if(index < 0){
	historyIndex = 0;
	} else if (index >= data.result.length){
	historyIndex = data.result.length - 1;
	} else {
	$("#timestamp").text("Timestamp: " + data.result[index].timestamp);
        $("#request").text("Request: " + data.result[index].request);
        displayOpenMeteo(JSON.parse(data.result[index].openmeteo));
        displayWeatherGov(JSON.parse(data.result[index].weathergov));
        displayOpenAI(JSON.parse(data.result[index].openai));
	}
	}).fail(function(error){

     });
}

function getIndex(zipcode, date, start,  move) {
console.log("started getIndex");
        a=$.ajax({
            url: "final.php/getlog",
            method: "GET"
        }).done(function(data){
	if(!(zipcode === "") && date === "") {
	  for (let i = start; i < data.result.length && i >= 0; i = i + move){
	    if (zipcode === data.result[i].request){
	      historyIndex = i;
              getLog(historyIndex);
              break;
	    }
	  }
	}else if (zipcode === "" && !(date === "")) {
          for (let i = start; i < data.result.length && i >= 0; i = i + move){
            if (data.result[i].timestamp.includes(date)){
              historyIndex = i;
	      getLog(historyIndex);
              break;
            }
          }
        }else if (!(zipcode === "") && !(date === "")) {
          for (let i = start; i < data.result.length && i >= 0; i = i + move){
            if (zipcode === data.result[i].request && data.result[i].timestamp.includes(date)){
              historyIndex = i;
              getLog(historyIndex);
              break;
            }
          }
        } else {
	  historyIndex = start;
	  getLog(historyIndex);
	}
	if(historyIndex < 0){
        historyIndex = 0;
        } else if (historyIndex >= data.result.length){
        historyIndex = data.result.length - 1;
	}
	}).fail(function(error){

     });

}

$(document).ready(function() {
 $("#addressButton").click(function() {
  var zip = $("#addressTextBox").val();
  getCoords(zip);
 });

$("#historyButton").click(function() {
  $("#buttonDiv1").show();
  $("#buttonDiv2").show();
  $("#historyLog").show();
  historyIndex = 0;
  zipSearch = $("#zipcodeTextBox").val();
  dateSearch = $("#dateTextBox").val();
  getIndex(zipSearch, dateSearch, historyIndex, 1);
 });

$("#forwardButton").click(function() {
  getIndex(zipSearch, dateSearch, historyIndex + 1, 1);
 });

$("#backwardButton").click(function() {
  getIndex(zipSearch, dateSearch, historyIndex - 1, -1);
 });

});
