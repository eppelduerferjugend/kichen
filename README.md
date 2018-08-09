# kichen

## Deployment

```bash
ansible-playbook deployment/deploy-production.yml -i deployment/hosts --vault-password-file .vault-password
```

## SQL statement

Average order completion duration over time:

```sql
SELECT
  DATE_FORMAT(FROM_UNIXTIME(FLOOR(
    UNIX_TIMESTAMP(`create_time`) / (15 * 60)) * 15 * 60
  ), "%H:%i")
    AS `time`,
  SUM(`quantity`)
    AS `portions`,
  (SUM(`complete_time`) - SUM(`create_time`)) / SUM(`quantity`) / 60
    AS `average_duration`
FROM
  `order`,
  `order_item`
WHERE
  `order`.`id` = `order_item`.`order_id`
GROUP BY `time`
ORDER BY `create_time` ASC
```

Portions count per waiter:

```sql
SELECT
  `waiter`,
  SUM(`quantity`) AS `portions`
FROM
  `order`,
  `order_item`
WHERE
  `order`.`id` = `order_item`.`order_id`
GROUP BY `waiter`
ORDER BY `portions` DESC
```
