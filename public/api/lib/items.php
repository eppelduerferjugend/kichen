<?php

function fetchItems()
{
  global $db, $items, $itemIdMap;

  if (isset($items)) {
    // return cache
    return $items;
  }

  // compose query
  $query = $db->prepare('SELECT * FROM `item` ORDER BY `order` ASC;');
  $query->execute();

  // retrieve items
  $itemIdMap = [];
  $subItems = [];

  while ($row = $query->fetch(PDO::FETCH_ASSOC)) {
    $item = [
      'id' => intval($row['id']),
      'parentId' =>
        $row['parent_id']
          ? intval($row['parent_id'])
          : null,
      'name' => $row['name'],
      'shortName' =>
        !empty($row['short_name'])
          ? $row['short_name']
          : $row['name'],
      'color' => $row['color'],
      'available' => $row['available'] === '1',
      'createTime' =>
        isset($row['create_time'])
          ? strtotime($row['create_time'])
          : null,
      'updateTime' =>
        isset($row['update_time'])
          ? strtotime($row['update_time'])
          : null,
    ];

    if ($item['parentId'] === null) {
      $item['items'] = [];
    } else {
      $item['parent'] = null;
      array_push($subItems, $item);
    }

    $itemIdMap[$item['id']] = $item;
  }

  // populate parents
  foreach ($subItems as $subItem) {
    $itemId = $subItem['id'];
    $parentItem = $itemIdMap[$subItem['parentId']];
    unset($parentItem['items']);
    $itemIdMap[$itemId]['parent'] = $parentItem;
  }

  // populate subitems
  foreach ($subItems as $subItem) {
    $parentId = $subItem['parentId'];
    array_push($itemIdMap[$parentId]['items'], $subItem);
  }

  // compose items
  $items = [];
  foreach ($itemIdMap as $id => $item) {
    if ($item['parentId'] === null) {
      array_push($items, $item);
    }
  }

  return $items;
}

function findItem($id)
{
  global $itemIdMap;
  // retrieve items and fill cache
  fetchItems();
  return isset($itemIdMap[$id]) ? $itemIdMap[$id] : null;
}
