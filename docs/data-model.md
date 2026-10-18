# QuickNotes Data Model

## 1. Overview

QuickNotes is a note-taking application that allows users to create, read, update, and delete notes. Users can organize their notes using tags.

The application uses a relational database to store users, notes, tags, and the relationships between notes and tags.

The data model contains four tables:

1. `users` — stores user account information.
2. `notes` — stores notes created by users.
3. `tags` — stores tags used to organize notes.
4. `note_tags` — connects notes to tags through a many-to-many relationship.

## 2. Entity Relationships

### Users and Notes

One user can create many notes, but each note belongs to one user.

Relationship: **One-to-many**

- One user can have zero or many notes.
- Each note must belong to an existing user.
- `notes.user_id` references `users.id`.

### Notes and Tags

One note can have multiple tags, and one tag can be assigned to multiple notes.

Relationship: **Many-to-many**

The `note_tags` table implements this relationship.

- `note_tags.note_id` references `notes.id`.
- `note_tags.tag_id` references `tags.id`.
- A note cannot be associated with the same tag more than once.

### Relationship Diagram

```text
+------------------+
|      users       |
+------------------+
| id (PK)          |
| name             |
| email (UNIQUE)   |
| created_at       |
+--------+---------+
         |
         | One-to-many
         |
         v
+------------------+
|      notes       |
+------------------+
| id (PK)          |
| user_id (FK)     |
| title            |
| body             |
| created_at       |
| updated_at       |
+--------+---------+
         |
         | One-to-many
         |
         v
+------------------+
|    note_tags     |
+------------------+
| note_id (PK, FK) |
| tag_id (PK, FK)  |
| created_at       |
+--------+---------+
         ^
         | Many-to-one
         |
+--------+---------+
|       tags       |
+------------------+
| id (PK)          |
| name (UNIQUE)    |
| created_at       |
+------------------+
```

The composite primary key in `note_tags` prevents duplicate associations between the same note and tag.

## 3. Table Structures

### 3.1 Users Table

The `users` table stores information about each registered user.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | Primary key, auto-increment | Unique user identifier |
| name | VARCHAR(100) | NOT NULL | User's display name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User's email address |
| created_at | TIMESTAMP | NOT NULL, default current timestamp | Account creation time |

The email address must be unique so that two user records cannot use the same email.

### 3.2 Notes Table

The `notes` table stores notes created by users.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | Primary key, auto-increment | Unique note identifier |
| user_id | INTEGER | NOT NULL, foreign key | User who owns the note |
| title | VARCHAR(100) | NOT NULL | Note title |
| body | TEXT | NOT NULL | Main note content |
| created_at | TIMESTAMP | NOT NULL, default current timestamp | Creation time |
| updated_at | TIMESTAMP | NOT NULL, default current timestamp | Last update time |

Each note belongs to one user. The foreign key ensures that a note cannot reference a nonexistent user.

The title is limited to 100 characters to match the frontend validation rules.

The application should update `updated_at` whenever a note is edited.

### 3.3 Tags Table

The `tags` table stores reusable labels that users can apply to notes.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | Primary key, auto-increment | Unique tag identifier |
| name | VARCHAR(50) | NOT NULL, UNIQUE | Tag name |
| created_at | TIMESTAMP | NOT NULL, default current timestamp | Creation time |

Tag names are unique to prevent duplicate labels such as multiple records for the same tag.

In a multi-user production application, tag ownership or global tag-sharing rules should be defined explicitly. This design treats tags as globally reusable labels.

### 3.4 Note_Tags Table

The `note_tags` table connects notes and tags.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| note_id | INTEGER | NOT NULL, primary key component, foreign key | Associated note |
| tag_id | INTEGER | NOT NULL, primary key component, foreign key | Associated tag |
| created_at | TIMESTAMP | NOT NULL, default current timestamp | Time the tag was assigned |

The combination of `note_id` and `tag_id` forms a composite primary key.

This ensures that the same tag cannot be assigned to the same note more than once.

## 4. SQL Schema

The following SQL creates all four tables and defines their primary keys, foreign keys, uniqueness rules, and required fields.

The schema uses SQLite-compatible syntax.

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_notes_title_length
        CHECK (length(title) BETWEEN 1 AND 100)
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_tags_name_length
        CHECK (length(name) BETWEEN 1 AND 50)
);

CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (note_id, tag_id),

    CONSTRAINT fk_note_tags_note
        FOREIGN KEY (note_id)
        REFERENCES notes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_note_tags_tag
        FOREIGN KEY (tag_id)
        REFERENCES tags(id)
        ON DELETE CASCADE
);
```

### Constraint Explanation

- **Primary keys:** Uniquely identify records.
- **Foreign keys:** Prevent notes and tag relationships from referencing nonexistent records.
- **NOT NULL:** Ensures required values are provided.
- **UNIQUE:** Prevents duplicate user emails and tag names.
- **CHECK:** Restricts note titles to 1–100 characters and tag names to 1–50 characters.
- **ON DELETE CASCADE:** Automatically removes a user's notes when the user is deleted and removes tag associations when a note or tag is deleted.
- **Composite primary key:** Prevents duplicate note-tag associations.

SQLite foreign-key enforcement must be enabled for each database connection using `PRAGMA foreign_keys = ON`.

The database constraints should complement, not replace, application-level validation.

## 5. Indexes

Indexes improve query performance by allowing the database to find matching records without scanning entire tables.

### 5.1 Index Notes by User

```sql
CREATE INDEX idx_notes_user_id
ON notes(user_id);
```

**Reason:** Quickly retrieves notes belonging to a specific user.

Example:

```sql
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = 1
ORDER BY created_at DESC;
```

### 5.2 Index Notes by Creation Time

```sql
CREATE INDEX idx_notes_created_at
ON notes(created_at);
```

**Reason:** Helps queries that sort or filter notes by creation time. A composite index on `(user_id, created_at)` may be more useful for the common query that retrieves one user's notes in reverse chronological order.

For that workload, the following composite index is a good alternative:

```sql
CREATE INDEX idx_notes_user_created
ON notes(user_id, created_at DESC);
```

In production, choose indexes based on actual query patterns and query plans. Avoid creating redundant indexes without a demonstrated need.

### 5.3 Index Note Tags by Tag

```sql
CREATE INDEX idx_note_tags_tag_id
ON note_tags(tag_id);
```

**Reason:** The composite primary key `(note_id, tag_id)` supports lookups starting with `note_id`, but it does not provide the same efficient access path for queries starting with `tag_id`. This index helps find all notes associated with a particular tag.

### 5.4 Unique Indexes

The following constraints automatically create unique indexes in SQLite:

- `users.email`
- `tags.name`
- The composite primary key `(note_tags.note_id, note_tags.tag_id)`

Separate duplicate indexes for these same columns are unnecessary.

## 6. Example Queries

### Query 1: Get All Notes Belonging to a User

```sql
SELECT
    id,
    title,
    body,
    created_at,
    updated_at
FROM notes
WHERE user_id = 1
ORDER BY created_at DESC;
```

**Purpose:** Retrieves a user's notes, showing the newest notes first.

The `idx_notes_user_created` index can support this query when that index is created.

### Query 2: Get All Tags Assigned to a Note

```sql
SELECT
    t.id,
    t.name
FROM tags AS t
INNER JOIN note_tags AS nt
    ON t.id = nt.tag_id
WHERE nt.note_id = 1
ORDER BY t.name;
```

**Purpose:** Retrieves the tags associated with a particular note.

### Query 3: Get All Notes With a Specific Tag

```sql
SELECT
    n.id,
    n.title,
    n.body,
    n.user_id,
    n.created_at
FROM notes AS n
INNER JOIN note_tags AS nt
    ON n.id = nt.note_id
INNER JOIN tags AS t
    ON nt.tag_id = t.id
WHERE t.name = 'work'
ORDER BY n.created_at DESC;
```

**Purpose:** Finds notes associated with the `work` tag.

### Query 4: Get Notes and Their Owners

```sql
SELECT
    n.id AS note_id,
    n.title,
    n.body,
    u.id AS user_id,
    u.name AS user_name,
    u.email
FROM notes AS n
INNER JOIN users AS u
    ON n.user_id = u.id
ORDER BY n.created_at DESC;
```

**Purpose:** Retrieves notes together with the details of the users who created them.

In a real multi-user application, access controls must ensure that users can only retrieve notes they are authorized to view.

## 7. SQL vs. NoSQL

### SQL Database

A relational SQL database stores information in structured tables with defined columns and relationships.

Advantages:

- Enforces relationships through foreign keys.
- Supports transactions.
- Provides constraints for data integrity.
- Supports joins across related tables.
- Makes it easier to query notes, owners, and tags together.

Disadvantages:

- Schema changes require planning.
- Complex relational workloads may require careful indexing and query optimization.
- Scaling a relational database horizontally can introduce operational complexity.

### NoSQL Database

A NoSQL database can store documents or other data structures with more flexible schemas.

Advantages:

- Flexible data models.
- Can be convenient for nested or rapidly changing records.
- Some systems provide straightforward horizontal scaling.

Disadvantages:

- Relational integrity may need to be enforced by application code.
- Queries spanning several entities can be less convenient, depending on the database.
- Duplicated data can require additional update and consistency logic.

### Recommendation

**QuickNotes should use a relational SQL database.**

Users, notes, tags, and note-tag relationships have clear relational structures. Foreign keys and constraints help maintain data integrity, while joins support queries that combine notes with their owners and tags.

A relational database also provides transactions that help ensure related updates are completed consistently.

For this application, SQL offers a straightforward and maintainable data model. NoSQL could be reconsidered if future requirements introduce workloads or access patterns that justify a different data model.

## 8. Data Integrity and Production Considerations

The database schema is only one part of maintaining reliable application data.

The backend should also:

- Validate incoming note titles and bodies.
- Authenticate users before allowing note operations.
- Check note ownership before reading, updating, or deleting private notes.
- Update `updated_at` whenever a note changes.
- Use database transactions when multiple related operations must succeed together.
- Enable and test foreign-key enforcement.
- Back up the database regularly and test restoration.
- Monitor query performance and review indexes as usage grows.
- Use parameterized SQL queries to prevent SQL injection.
- Apply appropriate authorization rules to tag operations.

The schema uses `ON DELETE CASCADE` for ownership and tag associations. A production application should define its deletion and retention policies carefully, especially if notes may need to be retained for auditing, recovery, or legal reasons.

## 9. Conclusion

The QuickNotes data model contains four relational tables: `users`, `notes`, `tags`, and `note_tags`.

Primary keys identify records, foreign keys maintain relationships, unique constraints prevent duplicate emails and tag names, and the composite primary key prevents duplicate note-tag associations.

Indexes support common operations such as retrieving a user's notes, sorting notes by creation time, and finding notes associated with a tag.

A relational SQL database is recommended because the application's data has clear relationships and benefits from constraints, transactions, and joins.

This schema provides the backend team with a foundation for implementing persistent note storage and tag management.
