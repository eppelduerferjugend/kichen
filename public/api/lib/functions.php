<?php

function matchUrl($url, $pattern)
{
  $matches = [];
  if (preg_match($pattern, $url, $matches) === 1) {
    array_shift($matches);
    return $matches;
  }
  return false;
}

function respondWith404()
{
  return respondWithError('Resource or method not found.', 404);
}

function respondWithError($message, $code = 500)
{
  global $db;
  http_response_code($code);
  return respondWithJson([
    'error' => [
      'code' => $code,
      'message' => $message,
    ],
  ]);
}

function respondWithJson($data)
{
  header('Content-Type: application/json; charset=utf-8');
  header('Access-Control-Allow-Origin: *');
  echo json_encode($data);
  die();
}
