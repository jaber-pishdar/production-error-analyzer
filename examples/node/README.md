# Example: Node.js Error Logs

This directory contains sample Node.js error logs for testing the parser.

## Example 1: Simple console.error

```
Error: Cannot find module 'express'
    at Function.Module._resolveFilename (module.js:547:15)
    at Function.Module._load (module.js:474:25)
    at Module.require (module.js:596:17)
    at require (internal/module.js:11:18)

TypeError: Cannot read property 'length' of undefined
    at Object.parse (/app/src/utils/parser.js:42:13)
    at handler (/app/src/routes/data.js:18:5)

Error: Connection refused to database at localhost:5432
    at Socket.<anonymous> (/app/src/db/connect.js:23:11)
    at Socket.emit (events.js:315:20)
```

## Example 2: Winston JSON format

```json
{"timestamp":"2024-03-15T10:30:00.000Z","level":"error","message":"User update failed","service":"user-service","endpoint":"/api/users/123","error":{"type":"ValidationError","message":"Email already exists"},"stack":"ValidationError: Email already exists\n    at UserService.update (user-service.js:87:13)\n    at process.processTicksAndRejections (internal/process/task_queues.js:95:5)"}
{"timestamp":"2024-03-15T10:30:01.000Z","level":"error","message":"Database query timeout","service":"user-service","endpoint":"/api/users/search","httpStatus":503,"stack":"QueryTimeoutError: Database query timeout\n    at Database.query (db/index.js:33:15)"}
{"timestamp":"2024-03-15T10:31:00.000Z","level":"warn","message":"Rate limit approaching","service":"api-gateway","endpoint":"/api/users/123","httpStatus":429}
```

## Example 3: Uncaught exception

```
Uncaught ReferenceError: process is not defined
    at file:///app/src/index.js:1:1
    at ModuleJob.run (internal/modules/esm/module_job.js:193:15)

Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'axios'
    at packageResolve (internal/modules/esm/resolve.js:763:9)
    at moduleResolve (internal/modules/esm/resolve.js:808:20)
```