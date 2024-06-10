// Customer config
var url = "{YOUR_TEAMUP_URL}";
var apiKey = "{YOUR_TEAMUP_API}";
var maxNumberOfEvents = 5;
var searchForMonths = 2;
var headerText = "Your Upcoming Events:";
var disableFlex = true;

var days = [
  "Zondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
];

// Dev variables
var calendarKeyOrId = new URL(url).pathname.split("/").filter(Boolean)[0];

// Creates a CORS request in a cross-browser manner
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari/IE10+.
    xhr.open(method, url, true);
    xhr.setRequestHeader("Teamup-Token", apiKey);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE8/IE9.
    xhr = new XDomainRequest();
    // XDomainRequest does not support querying HTTPS from HTTP pages
    if (window.location.protocol === "http:") {
      url = url.replace("https://", "http://");
    }
    if (["GET", "POST"].indexOf(method) === -1) {
      alert("XDomainRequest only supports GET and POST methods");
      return;
    }
    if (url.indexOf("?") === -1) {
      url += "?_teamup_token=" + apiKey;
    } else {
      url += "&_teamup_token=" + apiKey;
    }
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  }
  return xhr;
}

// Sends the actual CORS request.
function makeCorsRequest(url, successCallback, errorCallback) {
  var xhr = createCORSRequest("GET", url);
  if (!xhr) {
    alert("CORS not supported");
    return;
  }

  // Response handlers.
  xhr.onload = function () {
    if (xhr.status < 400) {
      if (successCallback) successCallback(xhr);
    } else if (errorCallback) {
      errorCallback(xhr);
    }
  };
  xhr.onerror = function () {
    if (errorCallback) {
      errorCallback(xhr);
    }
  };

  xhr.send();
}

// Get the current date and a date 2 months in the future
var startDate = new Date().toISOString().slice(0, 10);
var endDate = new Date(
  new Date().setMonth(new Date().getMonth() + searchForMonths)
)
  .toISOString()
  .slice(0, 10);

// Send a GET request for all events in a date range
makeCorsRequest(
  "https://api.teamup.com/" +
    calendarKeyOrId +
    "/events?startDate=" +
    startDate +
    "&endDate=" +
    endDate +
    "&tz=Europe/Amsterdam",
  function (xhr) {
    var events = JSON.parse(xhr.responseText).events;

    console.log("All Events:");
    console.log(events);

    // Filter events that contain 'kerkdienst' in the title
    var filteredEvents = events.filter(function (event) {
      return event.title.toLowerCase().includes("kerkdienst");
    });

    // Sort events by start date
    filteredEvents.sort(function (a, b) {
      return new Date(a.start_dt) - new Date(b.start_dt);
    });

    // Limit to maxNumberOfEvents upcoming events
    filteredEvents = filteredEvents.slice(0, maxNumberOfEvents);

    console.log("Filterd Events:");
    console.log(filteredEvents);

    var htmlOutput = `<h2 class="wp-block-heading"><mark style="background-color:rgba(0, 0, 0, 0);color:#f88a6b" class="has-inline-color">${headerText}:</mark></h2>`;

    // Start the output list
    if (disableFlex) {
      htmlOutput += '<ol style="white-space: nowrap;">';
    } else {
      htmlOutput += "<ol>";
    }

    function getDayName(date) {
      return days[date.getDay()];
    }

    // Format and display the filtered events
    filteredEvents.forEach(function (event) {
      var startDateTime = new Date(event.start_dt);
      var formattedDate = startDateTime.toISOString().slice(0, 10);
      var formattedTime = startDateTime.toTimeString().slice(0, 5);
      var dayName = getDayName(startDateTime); // Get day name

      // Construct the HTML for each event
      htmlOutput +=
        "<li>" +
        dayName +
        " " +
        formattedDate +
        " om " +
        formattedTime +
        " uur: " +
        event.who +
        ".</li>";
    });

    // Close the list
    htmlOutput += "</ol>";

    // Output the HTML
    document.getElementById("events-container").innerHTML = htmlOutput;
  },
  function (xhr) {
    console.error(
      "Request failed with code " + xhr.status + ": " + xhr.responseText
    );
  }
);
