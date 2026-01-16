<?php
error_reporting(0);

/*
   Final REST entry point
   Supports:
   - geminiproxy (POST)
   - addLog      (POST)
   - getlog      (GET)
*/

// -------------------- HEADERS --------------------
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// -------------------- CORS PREFLIGHT FIX (CRITICAL) --------------------
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// -------------------- INCLUDES --------------------
$DBSTRING = "sqlite:cse383.db";   // adjust if needed
include "sql.inc";
include "final.class.php";
require_once "RestServer.php";

// -------------------- ROUTING --------------------
// PATH_INFO example: /geminiproxy
$pathInfo = $_SERVER['PATH_INFO'] ?? '';
$method = trim(str_replace('/', '', $pathInfo));

if ($method === '') {
    http_response_code(404);
    echo json_encode(['error' => 'No endpoint specified']);
    exit;
}

// -------------------- DISPATCH --------------------
$rest = new RestServer(new final_rest(), $method);
$rest->handle();
