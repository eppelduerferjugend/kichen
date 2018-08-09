<?php

require_once 'lib/functions.php';
require_once 'lib/items.php';
require_once 'lib/orders.php';

// set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// retrieve config
$config = include 'config.php';

// connect to database
$db = new PDO(
  sprintf(
    'mysql:host=%s;dbname=%s;charset=utf8mb4',
    $config['db_hostname'],
    $config['db_database']
  ),
  $config['db_username'],
  $config['db_password']);

// set database timezone
$db->exec(sprintf('SET time_zone = "%s";', date('P')));

// retrieve url, method and request body
$url = strtok($_SERVER['REQUEST_URI'], '?');
$method = strtolower($_SERVER['REQUEST_METHOD']);
$body = file_get_contents('php://input');

// check api prefix
$urlPrefix = $config['api_url_prefix'];
if (substr($url, 0, strlen($urlPrefix)) !== $urlPrefix) {
  return respondWith404();
}

// remove prefix from url, trim it and add method
$url = $method . ' ' . trim(substr($url, strlen($urlPrefix)), '/');

// GET items
if ($url === 'get items')
{
  return respondWithJson(fetchItems());
}

// GET items/:id
if ($params = matchUrl($url, '#^get items/([0-9]+)$#'))
{
  $id = $params[0];
  $item = findItem($id);
  return $item ? respondWithJson($item) : respondWith404();
}

// GET stats
if ($url === 'get stats')
{
  return respondWithJson([
    'deliveredItems' => countDeliveredItems(),
  ]);
}

// GET orders
if ($url === 'get orders')
{
  $filters = [];

  if (isset($_GET['update_time']) && is_numeric($_GET['update_time'])) {
    $filters['updateTime'] = intval($_GET['update_time']);
  }

  return respondWithJson(fetchOrders($filters));
}

// PUT orders/:id
if ($params = matchUrl($url, '#^put orders/([0-9]+)$#'))
{
  try {
    $rawOrderUpdates = json_decode($body, true);
  } catch (Exception $e) {
    return respondWithError("Received invalid JSON.", 400);
  }

  // retrieve existing order
  $id = intval($params[0]);
  $order = fetchOrder($id);
  if ($order === null) {
    return respondWithError("Order does not exist in database.", 404);
  }

  $order = readOrder($rawOrderUpdates, $order);

  if (!updateOrder($id, $order)) {
    return respondWithError("Can't update order in database.", 500);
  }

  return respondWithJson([
    'success' => true,
  ]);
}

// POST orders
if ($url === 'post orders')
{
  try {
    $rawOrder = json_decode($body, true);
  } catch (Exception $e) {
    return respondWithError("Received invalid JSON.", 400);
  }

  $order = readOrder($rawOrder);

  // count incomplete items before placing new order
  $incompleteOrders = fetchOrders(['complete' => false]);
  $itemsBefore = 0;
  foreach ($incompleteOrders as $incompleteOrder) {
    foreach ($incompleteOrder['items'] as $item) {
      $itemsBefore += $item['quantity'];
    }
  }

  // place order
  $order = placeOrder($order);
  if ($order === false) {
    return respondWithError("Can't place order in database.", 500);
  }

  $order['itemsBefore'] = $itemsBefore;

  return respondWithJson([
    'success' => true,
    'order' => $order,
  ]);
}

return respondWith404();
