<?php

function fetchOrders($filters = [])
{
  global $db;

  $sql = '
    SELECT *, (
      SELECT SUM(`order_item`.`quantity`)
      FROM `order_item`
      WHERE `order_id` <= `order`.`id`
    ) AS `number`
    FROM `order`
    WHERE 1 ';

  if (isset($filters['updateTime'])) {
    $sql .= sprintf(
      'AND UNIX_TIMESTAMP(`update_time`) > %d ',
      $filters['updateTime']);
  }

  if (isset($filters['id'])) {
    $sql .= sprintf('AND `id` = %d ', $filters['id']);
  }

  if (isset($filters['complete'])) {
    if ($filters['complete'] === true) {
      $sql .= 'AND `complete_time` IS NOT NULL ';
    } else {
      $sql .= 'AND `complete_time` IS NULL ';
    }
  }

  $sql .= 'ORDER BY `create_time` DESC;';

  $orderQuery = $db->prepare($sql);
  $orderQuery->execute();

  $orders = [];
  while ($row = $orderQuery->fetch(PDO::FETCH_ASSOC)) {
    array_push($orders, [
      'id' => intval($row['id']),
      'number' => intval($row['number']),
      'waiter' => $row['waiter'],
      'table' => $row['table'],
      'comment' => $row['comment'],
      'items' => [],
      'createTime' =>
        isset($row['create_time'])
          ? strtotime($row['create_time'])
          : null,
      'updateTime' =>
        isset($row['update_time'])
          ? strtotime($row['update_time'])
          : null,
      'completeTime' =>
        isset($row['complete_time'])
          ? strtotime($row['complete_time'])
          : null,
    ]);
  }

  for ($i = 0; $i < count($orders); $i++) {
    $orderId = $orders[$i]['id'];

    $itemQuery = $db->prepare('
      SELECT * FROM `order_item`
      WHERE `order_id` = :orderId
      ORDER BY `quantity` DESC;
    ');

    $itemQuery->execute([
      'orderId' => $orderId,
    ]);

    while ($row = $itemQuery->fetch(PDO::FETCH_ASSOC)) {
      $itemId = intval($row['item_id']);
      $item = findItem($itemId);
      $item['quantity'] = intval($row['quantity']);
      array_push($orders[$i]['items'], $item);
    }
  }

  return $orders;
}

function fetchOrder($id)
{
  $orders = fetchOrders(['id' => $id]);
  return count($orders) === 1 ? $orders[0] : null;
}

function readOrder($data, $order = [])
{
  // read waiter
  if (isset($data['waiter'])) {
    $order['waiter'] = $data['waiter'];
  }

  // read table
  if (isset($data['table'])) {
    $order['table'] = $data['table'];
  }

  // read comment
  if (isset($data['comment'])) {
    $order['comment'] = $data['comment'];
  }

  // read complete
  if (isset($data['complete'])) {
    $order['completeTime'] = $data['complete'] === true ? time() : null;
  }

  // read items
  if (isset($data['items'])) {
    if (!is_array($data['items'])) {
      return respondWithError("Field 'items' invalid.", 400);
    }

    $order['items'] = [];
    foreach ($data['items'] as $rawItem) {
      if (!isset($rawItem['id']) ||
          !is_numeric($rawItem['id']) ||
          !isset($rawItem['quantity']) ||
          !is_numeric($rawItem['quantity'])) {
        return respondWithError("Entry of 'items' field invalid.", 400);
      }

      // find item
      $item = findItem(intval($rawItem['id']));
      if ($item === null) {
        return respondWithError("Entry of 'items' field invalid.", 400);
      }

      // populate quantity
      $item['quantity'] = intval($rawItem['quantity']);

      array_push($order['items'], $item);
    }
  }

  // verify waiter
  if (!isset($order['waiter']) || empty($order['waiter'])) {
    return respondWithError("Field 'waiter' missing or empty.", 400);
  }

  // verify table
  if (!isset($order['table']) || empty($order['table'])) {
    return respondWithError("Field 'table' missing or empty.", 400);
  }

  // filter comment
  if (!isset($order['comment'])) {
    $order['comment'] = null;
  }

  // filter complete time
  if (!isset($order['completeTime'])) {
    $order['completeTime'] = null;
  }

  // verify items
  if (!isset($order['items']) ||
      !is_array($order['items']) ||
      count($order['items']) === 0) {
    return respondWithError("Field 'items' missing or invalid.", 400);
  }

  return $order;
}

function placeOrder($order)
{
  global $db;

  // insert order
  $query = $db->prepare('
    INSERT INTO `order` (
      `waiter`, `table`, `comment`,
      `create_time`, `update_time`, `complete_time`
    ) VALUES (
      :waiter, :table, :comment,
      NOW(), NOW(), :completeTime
    );
  ');

  $success = $query->execute([
    'waiter' => $order['waiter'],
    'table' => $order['table'],
    'comment' => $order['comment'],
    'completeTime' => $order['completeTime']
  ]);

  if (!$success) {
    return false;
  }

  $orderId = (int) $db->lastInsertId();
  $success = insertItems($orderId, $order['items']);

  if (!$success) {
    return false;
  }

  return fetchOrder($orderId);
}

function updateOrder($orderId, $order)
{
  global $db;

  $fieldsMap = [
    'waiter' => 'waiter',
    'table' => 'table',
    'comment' => 'comment',
    'completeTime' => 'complete_time',
  ];

  $tokenValues = [];
  $setSqlParts = [];
  foreach ($order as $field => $value) {
    if (isset($fieldsMap[$field])) {
      $dbField = $fieldsMap[$field];
      array_push($setSqlParts, sprintf('`%s` = :%s', $dbField, $field));

      if (strstr($dbField, '_time') !== false) {
        // format date
        $tokenValues[$field] = $value ? date('Y-m-d H:i:s', $value) : null;
      } else {
        $tokenValues[$field] = $value;
      }
    }
  }

  // update order
  $query = $db->prepare(sprintf(
    'UPDATE `order` SET %s WHERE `id` = %d;',
    implode(', ', $setSqlParts),
    $orderId
  ));

  $success = $query->execute($tokenValues);

  if (!$success) {
    var_dump($query->errorInfo());
    return false;
  }

  // insert items
  return insertItems($orderId, $order['items']);
}

function insertItems($orderId, $items)
{
  global $db;

  // delete existing order items
  $deleteQuery = $db->prepare(
    'DELETE FROM `order_item` WHERE `order_id` = :orderId;');

  $success = $deleteQuery->execute(['orderId' => $orderId]);

  if (!$success) {
    return false;
  }

  // insert new items
  foreach ($items as $item) {
    $itemQuery = $db->prepare('
      INSERT INTO `order_item` (`order_id`, `item_id`, `quantity`)
      VALUES (:orderId, :itemId, :quantity);
    ');

    $success = $success && $itemQuery->execute([
      'orderId' => $orderId,
      'itemId' => $item['id'],
      'quantity' => $item['quantity'],
    ]);
  }

  return $success;
}

function countDeliveredItems()
{
  global $db;

  $sql = '
    SELECT SUM(`quantity`) AS `portions`
    FROM `order`, `order_item`
    WHERE
      `order`.`id` = `order_item`.`order_id` AND
      `order`.`complete_time` IS NOT NULL;
  ';

  $query = $db->prepare($sql);
  if ($query->execute()) {
    $row = $query->fetch(PDO::FETCH_ASSOC);
    return intval($row['portions']);
  } else {
    return 0;
  }
}
