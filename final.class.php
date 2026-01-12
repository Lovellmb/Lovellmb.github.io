<?php 
class final_rest
{



/**
 * @api  /api/v1/setTemp/
 * @apiName setTemp
 * @apiDescription Add remote temperature measurement
 *
 * @apiParam {string} location
 * @apiParam {String} sensor
 * @apiParam {double} value
 *
 * @apiSuccess {Integer} status
 * @apiSuccess {string} message
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *              "status":0,
 *              "message": ""
 *     }
 *
 * @apiError Invalid data types
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     {
 *              "status":1,
 *              "message":"Error Message"
 *     }
 *
 */
	public static function setTemp ($location, $sensor, $value)

	{
		if (!is_numeric($value)) {
			$retData["status"]=1;
			$retData["message"]="'$value' is not numeric";
		}
		else {
			try {
				EXEC_SQL("insert into temperature (location, sensor, value, date) values (?,?,?,CURRENT_TIMESTAMP)",$location, $sensor, $value);
				$retData["status"]=0;
				$retData["message"]="insert of '$value' for location: '$location' and sensor '$sensor' accepted";
			}
			catch  (Exception $e) {
				$retData["status"]=1;
				$retData["message"]=$e->getMessage();
			}
		}

		return json_encode ($retData);
	}


/**
 * @api  /api/v1/getLevel/
 * @apiName getLevel
 * @apiDescription Return all level data from database
 *
 * @apiSuccess {Integer} status
 * @apiSuccess {string} message
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *              "status":0,
 *              "message": ""
 *              "result": [
 *                { 
 *                  levelID: 1,
 *                  description: "",
 *                  prompt: ""
 *              ]
 *     }
 *
 * @apiError Invalid data types
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     {
 *              "status":1,
 *              "message":"Error Message"
 *     }
 *
 */
  public static function getLevel () {
		return json_encode ($retData);
  }

/**
 * @api  /api/v1/addLog/
 * @apiName addLog
 * @apiDescription Add record to logfile
 *
 * @apiParam {string} level
 * @apiParam {String} systemPrompt
 * @apiParam {String} userPrompt
 * @apiParam {string} chatResponse
 * @apiParam {Integer} inputTokens
 * @apiParam {Integer} outputTokens
 *
 * @apiSuccess {Integer} status
 * @apiSuccess {string} message
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *              "status":0,
 *              "message": ""
 *     }
 *
 * @apiError Invalid data types
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     {
 *              "status":1,
 *              "message":"Error Message"
 *     }
 *
 */  
	public static function addlog ($request, $weathergov, $openmeteo, $openai)

        {
       try {
                                EXEC_SQL("insert into transactions (request, weathergov, openmeteo, openai) values (?,?,?,?)", $request, $weathergov, $openmeteo, $openai);
                                $retData["status"]=0;
                                $retData["message"] = "Inserted into transactions: request='$request'";
                        }
                        catch  (Exception $e) {
                                $retData["status"]=1;
                                $retData["message"]=$e->getMessage();
                        }

                return json_encode ($retData);
        }
/**
 * @api  /api/v1/getLog/
 * @apiName getLog
 * @apiDescription Retrieve Log Records
 *
 * @apiParam {string} date
 * @apiParam {String} numRecords
 *
 * @apiSuccess {Integer} status
 * @apiSuccess {string} message
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *              "status":0,
 *              "message": ""
 *              "result": [
 *                { 
 *                  timeStamp: "YYYY-MM-DD HH:MM:SS",
 *                  level: "",
 *                  systemPrompt: "",
 *                  userPrompt: "",
 *                  chatResponse: "",
 *                  inputTokens: 0,
 *                  outputTokens: 0
 *              ]
 *     }
 *
 * @apiError Invalid data types
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     {
 *              "status":1,
 *              "message":"Error Message"
 *     }
 *
 */
  public static function getLog () 
{
                        try {
				$retData["message"] = "Retrieved from from transactions:";
                                $retData["result"]=GET_SQL("select timestamp, request, weathergov, openmeteo, openai from transactions");
                                $retData["status"]=0;
                        }
                        catch  (Exception $e) {
                                $retData["status"]=1;
                                $retData["message"]=$e->getMessage();
                        }

                return json_encode ($retData);
        }
  

  public static function openaiproxy($endpoint, $payload) {
    // 1. Your OpenAI API key
    // Physically stored in a non-web accessible location
    //(../password/openai.key)
    $apiKey = trim(file_get_contents("/var/www/password/api.key"));
    if (!$apiKey) {
    	//http_response_code(500);
    	return json_encode([
    	'error' => 'OpenAI API key not configured on server'
  	  ]);
  }
  // 2. Build the URL:
  $endpoint = ltrim($endpoint, '/');
  $url = "https://api.openai.com/v1/" . $endpoint;
  // 3. Decode payload (coming in as JSON string) into array
  $data = json_decode($payload, true);
  if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
  	//http_response_code(400);
  	return json_encode([
	'error' => 'Invalid JSON in payload',
	'detail' => json_last_error_msg()
	]);
  }
  // 4. Set up cURL
  $ch = curl_init($url);
  $headers = [
  'Content-Type: application/json',
  'Authorization: Bearer ' . $apiKey,
  ];
  curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => $headers,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 60,
  CURLOPT_POSTFIELDS => json_encode($data),
  ]);
  // 5. Execute the request
  $responseBody = curl_exec($ch);
  $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $curlError = curl_error($ch);
  curl_close($ch);
  // 6. Handle cURL errors
  if ($responseBody === false) {
  	//http_response_code(502);
  	return json_encode([
  	'error' => 'Error calling OpenAI',
  	'detail' => $curlError,
  	]);
  }
  // 7. Try to decode OpenAI response; if it fails, return raw string
  $decoded = json_decode($responseBody, true);
  if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
  	// Not valid JSON (very unlikely), just pass raw body
	//http_response_code($httpCode ?: 502);
	return json_encode([
	'raw' => $responseBody,
	'error' => 'Invalid JSON returned from OpenAI',
	'detail'=> json_last_error_msg(),
	]);
  }
  // 8. Pass through status and JSON from OpenAI
  //http_response_code($httpCode ?: 200);
  return $responseBody;
  }
   
}

