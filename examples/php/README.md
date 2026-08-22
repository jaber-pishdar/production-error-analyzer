# Example: PHP Error Logs

## Example 1: Standard PHP error log

```
[15-Mar-2024 10:30:00 UTC] PHP Warning:  mysqli_connect(): (HY000/2002): Connection refused in /var/www/html/includes/db.php on line 24
[15-Mar-2024 10:30:01 UTC] PHP Fatal error:  Uncaught TypeError: Argument 1 passed to UserService::update() must be an instance of User, string given in /var/www/html/src/UserService.php:87
Stack trace:
#0 /var/www/html/src/controllers/UserController.php(42): UserService->update()
#1 /var/www/html/public/index.php(18): UserController->handleRequest()
#2 {main}
  thrown in /var/www/html/src/UserService.php on line 87
[15-Mar-2024 10:31:00 UTC] PHP Notice:  Undefined index: user_id in /var/www/html/src/middleware/AuthMiddleware.php on line 15
```

## Example 2: Laravel-style log

```
[2024-03-15 10:32:00] local.ERROR: SQLSTATE[42S02]: Base table or view not found: 1146 Table 'production.users' doesn't exist (SQL: select * from `users` where `email` = ?) {"userId":123,"exception":"[object] (Illuminate\\Database\\QueryException(code: 42S02): SQLSTATE[42S02]..."} 
[2024-03-15 10:33:00] local.WARNING: Session expired for user 123 {"userId":123,"ip":"192.168.1.1"}
```