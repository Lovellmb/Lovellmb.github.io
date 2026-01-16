<?php

class final_rest
{

/* -------------------- ADD LOG -------------------- */
public static function addlog ($request, $weathergov, $openmeteo, $openai)
{
    try {
        EXEC_SQL(
            "insert into transactions (request, weathergov, openmeteo, openai)
             values (?,?,?,?)",
            $request, $weathergov, $openmeteo, $openai
        );

        $retData["status"]  = 0;
        $retData["message"] = "Inserted into transactions: request='$request'";
    }
    catch (Exception $e) {
        $retData["status"]  = 1;
        $retData["message"] = $e->getMessage();
    }

    return json_encode($retData);
}


/* -------------------- GET LOG -------------------- */
public static function getlog ()
{
    try {
        $retData["status"]  = 0;
        $retData["message"] = "Retrieved from transactions";
        $retData["result"]  = GET_SQL(
            "select timestamp, request, weathergov, openmeteo, openai
             from transactions
             order by timestamp desc"
        );
    }
    catch (Exception $e) {
        $retData["status"]  = 1;
        $retData["message"] = $e->getMessage();
    }

    return json_encode($retData);
}


/* -------------------- GEMINI PROXY -------------------- */
public static function geminiproxy($model, $payload)
{
    
    $apiKey = getenv('API_KEY');

    if (!$apiKey) {
        return json_encode([
            'error' => 'Google API key not configured'
        ]);
    }

    // Build Gemini endpoint
    $model = urlencode($model);
    $url = "https://generativelanguage.googleapis.com/v1beta/models/"
         . $model
         . ":generateContent?key=" . $apiKey;

    // cURL
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 60,
      
        CURLOPT_POSTFIELDS     => $payload
    ]);

    $responseBody = curl_exec($ch);
    $curlError    = curl_error($ch);
    curl_close($ch);

    if ($responseBody === false) {
        return json_encode([
            'error'  => 'Error calling Google AI',
            'detail' => $curlError
        ]);
    }

    // Pass-through Gemini response
    return $responseBody;
}

}
