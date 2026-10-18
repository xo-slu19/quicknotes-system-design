# QuickNotes System Design

## Project Description

QuickNotes is a notes application project that demonstrates how a browser-based frontend can communicate with an API and how the system could be designed to support one million registered users.

The project contains a working API client using the JSONPlaceholder practice API and three design documents covering REST API design, relational database modeling, and scalable system architecture.

## Features

- Load 10 notes from the API using GET.
- Create notes using POST.
- Delete notes using DELETE.
- Validate note titles.
- Display loading, success, error, and empty states.
- Disable action buttons while requests are running.
- Render user-provided text safely using `textContent`.
- Document the production API, database schema, and scaling architecture.

## Project Structure

```text
quicknotes-system-design/
├── index.html
├── style.css
├── api.js
├── README.md
└── docs/
    ├── api-design.md
    ├── data-model.md
    └── architecture.md
```

## How to Run the API Client

The frontend is a static HTML, CSS, and JavaScript application.

### Option 1: Run Locally

1. Download or clone the repository.
2. Open the project folder in a local development environment.
3. Start a local static web server.
4. Open the local server address in your browser.
5. Click **Load notes** to retrieve sample notes.
6. Enter a title and optional body, then submit the form to create a note.
7. Click a note's Delete button to test deletion.

Opening the page through a local web server is recommended instead of opening the HTML file directly.

### Option 2: Use GitHub Pages

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Select the `main` branch and the root folder as the publishing source.
4. Save the settings.
5. Wait for GitHub Pages to publish the site.
6. Open the published URL and test the application.

The client uses the public JSONPlaceholder practice API at:

`https://jsonplaceholder.typicode.com/posts`

JSONPlaceholder simulates POST and DELETE responses but does not permanently store created notes or persist deletions. The application reflects those changes in its current browser session.

## Design Documents

- [REST API Design](docs/api-design.md)
- [Database Data Model](docs/data-model.md)
- [System Architecture and Scaling Plan](docs/architecture.md)

## What I Learned

1. **API communication:** How to use `fetch`, async/await, HTTP methods, response status codes, and error handling.
2. **Frontend validation and safety:** How to validate input, disable buttons during requests, and use `textContent` to display user-provided data safely.
3. **REST API design:** How to document endpoints, request and response bodies, authentication, and error status codes.
4. **Relational databases:** How primary keys, foreign keys, one-to-many relationships, many-to-many relationships, joins, and indexes work together.
5. **System architecture:** How caching, load balancing, read replicas, queues, and workers can help a service scale.
6. **Trade-offs:** How performance, consistency, availability, reliability, and operational complexity influence architecture decisions.

## Limitations

This project uses JSONPlaceholder as a practice API. It does not provide real user authentication, permanent note storage, or production-grade authorization.

The design documents describe how a production QuickNotes backend could be implemented.

## Author

QuickNotes System Design Project
