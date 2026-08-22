# Example: Python Error Logs

## Example 1: Standard logging module

```
2024-03-15 10:30:00,000 - myapp - ERROR - Database connection failed: timeout
2024-03-15 10:30:01,000 - myapp - WARNING - Retry attempt 1/3 for database connection
2024-03-15 10:30:05,000 - myapp - ERROR - User 123 not found in cache
2024-03-15 10:31:00,000 - myapp - CRITICAL - Out of memory: cannot allocate 2GB
```

## Example 2: Full traceback

```
Traceback (most recent call last):
  File "/app/src/main.py", line 42, in handle_request
    result = await process_data(payload)
  File "/app/src/processor.py", line 87, in process_data
    validate_record(record)
  File "/app/src/validator.py", line 15, in validate_record
    raise ValidationError(f"Invalid record: {record}")
ValidationError: Invalid record: {'id': None, 'name': ''}

ERROR:myapp.api:Request failed with status 500
```

## Example 3: Django-style error

```
Internal Server Error: /api/users/
Traceback (most recent call last):
  File "/app/venv/lib/python3.11/site-packages/django/core/handlers/exception.py", line 55, in inner
    response = get_response(request)
  File "/app/venv/lib/python3.11/site-packages/django/core/handlers/base.py", line 197, in _get_response
    response = wrapped_callback(request, *callback_args, **callback_kwargs)
  File "/app/src/users/views.py", line 24, in list_users
    users = User.objects.filter(is_active=True)
  File "/app/venv/lib/python3.11/site-packages/django/db/models/query.py", line 1356, in filter
    return self._filter_chain(*args, **kwargs)
  File "/app/venv/lib/python3.11/site-packages/django/db/models/query.py", line 1279, in _filter_chain
    return query.filter(*args, **kwargs)
django.db.utils.OperationalError: no such table: users_user
```

## Example 4: Simple script error

```
ERROR:root:Failed to load config file: /etc/myapp/config.ini
Traceback (most recent call last):
  File "config_loader.py", line 12, in load_config
    with open(path) as f:
FileNotFoundError: [Errno 2] No such file or directory: '/etc/myapp/config.ini'
```