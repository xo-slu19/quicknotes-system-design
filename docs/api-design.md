# QuickNotes REST API Design

## 1. Overview

The QuickNotes API allows authenticated users to create, view, update, and delete notes and organize notes with tags.

**Base URL:** `/api/v1`

**Data format:** JSON

**Authentication:** Bearer token

Example authentication header:

`Authorization: Bearer <access_token>`

## 2. Data Model

A note contains:

- `id`: Unique note identifier.
- `title`: Required title, maximum 100 characters.
- `body`: Optional note content.
- `userId`: ID of the note's owner.
- `createdAt`: Creation timestamp.
- `updatedAt`: Last modification timestamp.

Users can only access or modify notes they are authorized to use.

## 3. REST Endpoints

| Method | Path | Description | Success Status |
|---|---|---|---|
| GET | `/api/v1/notes` | List the authenticated user's notes | 200 OK |
| GET | `/api/v1/notes/{id}` | Retrieve one note | 200 OK |
| POST | `/api/v1/notes` | Create a note | 201 Created |
| PUT | `/api/v1/notes/{id}` | Replace an existing note | 200 OK |
| PATCH | `/api/v1/notes/{id}` | Update selected note fields | 200 OK |
| DELETE | `/api/v1/notes/{id}` | Delete a note | 204 No Content |
| GET | `/api/v1/tags` | List the user's tags | 200 OK |
| POST | `/api/v1/notes/{id}/tags` | Add a tag to a note | 200 OK |

### List Notes

**Request**

`GET /api/v1/notes?limit=10&offset=0`

The server returns notes owned by the authenticated user.

**Success status:** `200 OK`

**Example response**

```json
{
  "data": [
    {
      "id": 101,
      "title": "Project plan",
      "body": "Finish the project documentation.",
      "userId": 7,
      "createdAt": "2026-10-18T10:00:00Z",
      "updatedAt": "2026-10-18T10:00:00Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 1
  }
}
```

### Create a Note

**Request**

`POST /api/v1/notes`

**Headers**

`Content-Type: application/json`

`Authorization: Bearer <access_token>`

**Example request body**

```json
{
  "title": "Project plan",
  "body": "Finish the project documentation."
}
```

The server obtains the user ID from the authenticated session rather than trusting a client-supplied owner ID.

**Success status:** `201 Created`

**Example response**

```json
{
  "id": 101,
  "title": "Project plan",
  "body": "Finish the project documentation.",
  "userId": 7,
  "createdAt": "2026-10-18T10:00:00Z",
  "updatedAt": "2026-10-18T10:00:00Z"
}
```

### Retrieve One Note

**Request**

`GET /api/v1/notes/101`

**Success status:** `200 OK`

Returns the note if it exists and the authenticated user is allowed to access it.

### Replace a Note

**Request**

`PUT /api/v1/notes/101`

**Example request body**

```json
{
  "title": "Updated project plan",
  "body": "Review and finish the documentation."
}
```

**Success status:** `200 OK`

Replaces the editable fields of the existing note.

### Partially Update a Note

**Request**

`PATCH /api/v1/notes/101`

**Example request body**

```json
{
  "title": "Revised project plan"
}
```

**Success status:** `200 OK`

Updates only the supplied editable fields.

### Delete a Note

**Request**

`DELETE /api/v1/notes/101`

**Success status:** `204 No Content`

Deletes the note. The response has no body.

### List Tags

**Request**

`GET /api/v1/tags`

**Success status:** `200 OK`

Returns tags available to the authenticated user.

### Add a Tag to a Note

**Request**

`POST /api/v1/notes/101/tags`

**Example request body**

```json
{
  "tagId": 5
}
```

**Success status:** `200 OK`

Associates the specified tag with the note, provided the user has permission to use both resources.

## 4. Error Status Codes

| Status | Name | Meaning |
|---|---|---|
| 400 | Bad Request | Invalid JSON, missing required fields, or invalid values |
| 401 | Unauthorized | Authentication is missing or invalid |
| 403 | Forbidden | The user is authenticated but lacks permission |
| 404 | Not Found | The requested resource does not exist or is not accessible |
| 409 | Conflict | The request conflicts with the current resource state |
| 422 | Unprocessable Entity | The request is syntactically valid but fails a business validation rule |
| 429 | Too Many Requests | The client has exceeded a rate limit |
| 500 | Internal Server Error | An unexpected server error occurred |

## 5. Example Error Response

A request to create a note without a title returns `400 Bad Request`.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data.",
    "details": [
      {
        "field": "title",
        "message": "Title is required and must not exceed 100 characters."
      }
    ],
    "requestId": "req-example-123"
  }
}
```

Error responses should use consistent JSON structures and avoid exposing passwords, secrets, stack traces, or internal database details.

## 6. Security and Validation

- Require authentication for private note operations.
- Check note ownership before reading, updating, or deleting a note.
- Validate that titles are present and no longer than 100 characters.
- Validate JSON request bodies on the server.
- Use parameterized database queries to reduce SQL injection risk.
- Apply rate limits to protect the API from excessive requests.
- Use HTTPS to protect data in transit.
