# QuickNotes System Architecture

## 1. Functional Requirements

The system must:

1. Allow users to register and authenticate.
2. Allow authenticated users to create notes.
3. Allow users to retrieve their notes.
4. Allow users to update and delete their notes.
5. Allow users to organize notes with tags.
6. Prevent users from accessing notes they do not own.
7. Validate note titles and request data.
8. Display clear success, loading, empty, and error states.
9. Support growing numbers of users and requests.

## 2. Non-Functional Requirements

### Performance

Common note-reading requests should return quickly. Caching and database indexes should reduce unnecessary work.

### Scalability

The application should support horizontal scaling by adding app servers, workers, and read replicas as demand increases.

### Availability

The system should continue serving requests when an individual application instance fails.

### Security

Use HTTPS, secure authentication, authorization checks, input validation, rate limiting, and encrypted storage where appropriate.

### Durability

User notes must be stored persistently and protected through database backups and a tested recovery process.

### Maintainability

The system should use clear API contracts, monitoring, logs, automated tests, and documented deployment procedures.

### Consistency

Database writes must preserve ownership and relationship constraints. Read replicas and caches may briefly lag behind recent changes.

## 3. Assumptions for One Million Users

The estimate uses the following assumptions:

- Registered users: 1,000,000.
- Daily active users: 10% of registered users.
- Each daily active user reads 20 notes per day.
- Each daily active user creates 1 note per day.
- Each note, including text and basic metadata, averages 2 KB.
- A year contains 365 days.
- All daily activity is averaged across 86,400 seconds per day.
- Storage estimates exclude indexes, backups, replication, logs, and other database overhead.

These are planning assumptions, not measured production traffic.

## 4. Load Estimates

### Daily Active Users

1,000,000 × 10% = 100,000 daily active users.

### Reads Per Second

Daily reads:

100,000 × 20 = 2,000,000 reads per day.

Average reads per second:

2,000,000 ÷ 86,400 ≈ 23.15 reads per second.

Therefore, the average load is approximately **23 reads per second**.

### Writes Per Second

Daily writes:

100,000 × 1 = 100,000 writes per day.

Average writes per second:

100,000 ÷ 86,400 ≈ 1.16 writes per second.

Therefore, the average load is approximately **1.2 writes per second**.

This estimate counts note creation only. Updates, deletes, tag changes, and other database writes would increase the total.

### Storage Per Year

Daily new notes:

100,000 notes per day.

Storage per day:

100,000 × 2 KB = 200,000 KB per day.

Using decimal units, this is approximately 200 MB per day.

Storage per year:

200 MB × 365 = 73,000 MB.

This is approximately **73 GB of new note data per year**.

This estimate assumes each new note averages 2 KB and does not account for growth in note bodies, attachments, indexes, backups, or replicas.

If users retain their notes, storage grows over time. Updates may also add write load without necessarily creating new notes.

### Read-Heavy or Write-Heavy?

QuickNotes is expected to be read-heavy under these assumptions because it performs approximately 23 reads per second compared with 1.2 note creations per second.

The system should prioritize fast note retrieval using indexes, caching, and read replicas while preserving reliable writes to the primary database.

## 5. Architecture Diagram

```text
                       +------------------+
                       |      Client      |
                       | Browser / Mobile |
                       +------------------+
                                |
                                v
                       +------------------+
                       |       DNS        |
                       +------------------+
                                |
                                v
                       +------------------+
                       |       CDN        |
                       | Static Assets    |
                       +------------------+
                                |
                                v
                       +------------------+
                       |  Load Balancer   |
                       +------------------+
                          /            \
                         v              v
                +---------------+  +---------------+
                |  App Server 1 |  |  App Server 2 |
                +---------------+  +---------------+
                         \              /
                          \            /
                           v          v
                         +--------------+
                         |    Cache     |
                         +--------------+
                                |
                                v
                       +------------------+
                       | Primary Database |
                       +------------------+
                                |
                                v
                       +------------------+
                       |  Read Replica    |
                       +------------------+

                Background / Asynchronous Work

                       +------------------+
                       |      Queue       |
                       +------------------+
                                |
                                v
                       +------------------+
                       |      Worker      |
                       +------------------+
                                |
                                v
                       +------------------+
                       | Primary Database |
                       +------------------+
```

This is a logical diagram. In production, database replication, cache access, job production, and job processing would be configured according to the operation being performed. Static assets can be served directly by the CDN, while API requests must reach the application service.

## 6. What Each Component Solves

### Client

The client provides the user interface for creating, reading, updating, and deleting notes.

### DNS

DNS translates the service's domain name into the address of the appropriate entry point, allowing users to access the application through a stable hostname.

### CDN

The CDN caches and delivers static assets such as CSS, JavaScript, and images from locations closer to users, reducing latency and origin-server traffic.

### Load Balancer

The load balancer distributes incoming API requests across healthy application instances so that one server does not receive all the traffic.

### App Servers

App servers authenticate requests, enforce permissions, validate input, execute application logic, and coordinate database and cache access.

### Cache

The cache stores frequently requested note data or other reusable results to reduce repeated database queries and improve response times.

### Primary Database

The primary database persistently stores users, notes, tags, and relationships and handles authoritative writes.

### Read Replica

The read replica receives changes from the primary database and handles suitable read queries, reducing read pressure on the primary.

### Queue

The queue stores background jobs so that work that does not need to finish during an API request can be processed asynchronously.

### Worker

The worker processes queued jobs, such as notifications, search-index updates, or other background tasks, without blocking the main request path.

## 7. GET /notes Request Flow

1. The client sends `GET /api/v1/notes` to the service domain.
2. DNS resolves the domain to the application's entry point.
3. The request reaches the load balancer, which selects a healthy app server.
4. The app server authenticates the user and checks their permissions.
5. The app server checks the cache for the user's notes.
6. If the cache contains valid data, the app server returns the cached result.
7. If the cache misses, the app server queries the read replica when the query can tolerate replication lag.
8. If strongly consistent data is required, the application reads from the primary database instead.
9. The app server returns the notes in a JSON response.
10. Suitable results may be cached for subsequent requests.

The server must filter notes by the authenticated user's identity so that one user cannot access another user's private notes.

## 8. POST /notes Request Flow

1. The client sends `POST /api/v1/notes` with a JSON body containing the title and optional body.
2. DNS resolves the service domain and the load balancer forwards the request to a healthy app server.
3. The app server authenticates the user and validates the title, body, and request format.
4. The app server inserts the new note into the primary database inside an appropriate transaction.
5. The database returns the new note ID and stored record.
6. The app server invalidates or updates affected cached data.
7. If background processing is needed, the app server publishes a job to the queue.
8. A worker processes the job asynchronously, such as updating a search index or sending a notification.
9. The app server returns `201 Created` and the created note as JSON.

The API should return success only after the database has safely committed the note. Background work should not delay the response unless that work is required to complete the operation correctly.

## 9. Trade-Offs

### Trade-Off 1: Cache Speed vs. Data Freshness

Caching improves response time and reduces database load.

However, cached notes may be stale after an update or delete. The application needs a suitable expiration or invalidation strategy and must avoid serving data across users' authorization boundaries.

### Trade-Off 2: Read Replicas vs. Immediate Consistency

Read replicas can increase read capacity and reduce pressure on the primary database.

However, replication lag may mean that a newly created or updated note is not immediately visible on the replica. The application can direct read-after-write requests to the primary when necessary.

### Trade-Off 3: Synchronous Work vs. Background Queues

Queues let the API respond quickly while workers process nonessential background jobs.

However, jobs may be delayed or retried. Workers must handle failures, and jobs should be idempotent so that retries do not produce duplicate side effects.

### Trade-Off 4: Availability vs. Operational Complexity

Multiple app servers and replicas can improve availability.

However, they introduce additional deployment, monitoring, replication, and recovery complexity.

## 10. Avoiding Single Points of Failure

- **Application servers:** Run at least two instances behind a load balancer and distribute them across separate failure domains where possible.
- **Load balancer:** Use a managed or redundant load-balancing service with health checks rather than relying on one manually maintained instance.
- **DNS:** Use a reliable managed DNS provider and appropriate health and failover arrangements.
- **CDN:** Use a distributed CDN service with origin protection and monitoring.
- **Database:** Use automated backups, monitoring, tested restore procedures, and a configured failover strategy for the primary and replica. A read replica alone is not a complete high-availability solution.
- **Cache:** Configure timeouts and a fallback path so temporary cache failure does not necessarily make all note reads unavailable.
- **Queue:** Use a durable queue service with retry policies and dead-letter handling where supported.
- **Workers:** Run multiple workers so one worker failure does not stop all background processing.
- **Monitoring:** Alert on error rates, latency, database health, queue backlog, and resource exhaustion.

High availability also requires testing failover and recovery. Having two instances is helpful, but it does not guarantee availability unless their dependencies and failure modes are addressed.

## Conclusion

QuickNotes can support one million registered users by using horizontally scalable app servers, caching, a primary database with a read replica, and asynchronous background processing.

Under the stated assumptions, the system averages approximately 23 reads per second, 1.2 note creations per second, and 73 GB of new note storage per year.

The design should prioritize reliable data storage, authorization, efficient note reads, and graceful recovery from component failures. Capacity should be adjusted using measured traffic, peak demand, note sizes, and production monitoring.
