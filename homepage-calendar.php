<?php
/**
 * Plugin Name: HomePage Calendar
 * Plugin URI: https://github.com/Tristan-23/teamup-calander-addon
 * Description: Displays upcoming events list from TeamUp Calendar
 * Author: Tristán Nouwens
 * Version: 1.0.0
 * Requires at least: 1.0.0
 * Author URI: https://www.linkedin.com/in/trist%C3%A1n-nouwens-25979829b/
 *
 * Copyright 2024 TN23  ( email: Tristan.Nouwens@student.gildeopleidingen.nl )
 */

// Include the Composer autoload file
require __DIR__ . '/vendor/autoload.php';

// Use the GuzzleHttp Client
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

// Define the shortcode handler function
function getDataChurch() {
    // Customer config
    $url = '{YOUR_TEAMUP_URL}';
    $apiKey = '{YOUR_TEAMUP_API}';
    $maxNumberOfEvents = 5; // max number of events displayed
    $searchForMonths = 2; // amout of months that needs to be searched
    $headerText = 'Your Upcoming Events:'; // header of list
    $disableFlex = true; // make it no-wrap

    // Dev variables
    $calendarKeyOrId = parse_url($url, PHP_URL_PATH);
    $calendarKeyOrId = trim($calendarKeyOrId, '/');
    $eventsArray = [];

    // Create a new GuzzleHttp Client instance with headers
    $client = new Client([
        'headers' => [
            'Teamup-Token' => $apiKey
        ],
        'verify' => false // Disable SSL certificate verification
    ]);

    try {
        // Get the current date and a date 2 months in the future
        $startDate = date('Y-m-d');
        $endDate = date('Y-m-d', strtotime("+$searchForMonths months"));

        // Send a GET request to the Teamup API
        $response = $client->get("https://api.teamup.com/$calendarKeyOrId/events", [
            'query' => [
                'startDate' => $startDate,
                'endDate' => $endDate,
                'tz' => 'Europe/Amsterdam'
            ]
        ]);

        // Decode the response body to an associative array
        $events = json_decode($response->getBody(), true)['events'];

        // Filter events that contain 'kerkdienst' in the title
        $filteredEvents = array_filter($events, function($event) {
            return stripos($event['title'], 'kerkdienst') !== false;
        });

        // Sort events by start date
        usort($filteredEvents, function($a, $b) {
            return strtotime($a['start_dt']) - strtotime($b['start_dt']);
        });

        // Limit to 5 upcoming events
        $filteredEvents = array_slice($filteredEvents, 0, $maxNumberOfEvents);

        // Days of the week in Dutch
        $days = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

        $htmlOutput = "<h2 class=\"wp-block-heading\"><mark style=\"background-color:rgba(0, 0, 0, 0);color:#f88a6b\" class=\"has-inline-color\">$headerText</mark></h2>";

        // Start the output list
        if ($disableFlex) {
            $htmlOutput .= "<ol style=\"white-space: nowrap;\">";
        } else {
            $htmlOutput .= "<ol>";
        }

        // Format and display the filtered events
        foreach ($filteredEvents as $event) {
            $startDateTime = new DateTime($event['start_dt']);
            $formattedDate = $startDateTime->format('Y-m-d');
            $formattedTime = $startDateTime->format('H:i');
            $dayName = $days[$startDateTime->format('w')]; // Get day name

            // Construct the HTML for each event
            $htmlOutput .= "<li>{$dayName} {$formattedDate} om {$formattedTime} uur: {$event['who']}.</li>";

        }

        // Close the list
        $htmlOutput .= "</ol>";

        // Return the HTML
        return $htmlOutput;

    } catch (RequestException $e) {
        // Output error message if a request exception occurs
        return 'Gildeopleidingen : Request failed: ' . $e->getMessage();
    }
}

// Register the shortcode
add_shortcode('AddonCalendarTeamUp', 'getDataChurch');
?>
