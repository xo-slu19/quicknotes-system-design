// JSONPlaceholder practice API
const API_URL = "https://jsonplaceholder.typicode.com/posts";

// Get elements from the HTML
const loadButton = document.getElementById("load-btn");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitButton = document.getElementById("submit-btn");
const statusMessage = document.getElementById("status");
const notesList = document.getElementById("notes-list");

// Keep track of notes displayed in the browser
let notes = [];

// Reusable request function
async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    let data = null;

    if (response.status !== 204) {
        data = await response.json();
    }

    return {
        data,
        status: response.status
    };
}

// Display status messages
function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = type;
}

// Create and display one note safely
function createNoteElement(note) {
    const item = document.createElement("li");
    item.className = "note";

    const title = document.createElement("h3");
    title.textContent = note.title || "Untitled note";

    const body = document.createElement("p");
    body.textContent = note.body || "No note body provided.";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
        deleteNote(note.id, item, deleteButton);
    });

    item.append(title, body, deleteButton);

    return item;
}

// Render the current notes list
function renderNotes() {
    notesList.replaceChildren();

    if (notes.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.className = "empty-state";
        emptyMessage.textContent =
            "No notes to display. Load notes or create your first note.";

        notesList.appendChild(emptyMessage);
        return;
    }

    notes.forEach((note) => {
        notesList.appendChild(createNoteElement(note));
    });
}

// GET: Load 10 notes from the server
async function loadNotes() {
    loadButton.disabled = true;
    showStatus("Loading notes...");

    try {
        const result = await request(`${API_URL}?_limit=10`);

        notes = result.data;
        renderNotes();

        if (notes.length === 0) {
            showStatus("No notes were found.", "success");
        } else {
            showStatus(
                `Loaded ${notes.length} notes from the server.`,
                "success"
            );
        }
    } catch (error) {
        showStatus(
            "Unable to load notes. Please check your connection and try again.",
            "error"
        );

        console.error("Loading notes failed:", error);
    } finally {
        loadButton.disabled = false;
    }
}

// POST: Create a note on the server
async function createNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    // Validate the title before making a request
    if (title.length === 0) {
        showStatus("Please enter a title for your note.", "error");
        titleInput.focus();
        return;
    }

    if (title.length > 100) {
        showStatus(
            "The title must not exceed 100 characters.",
            "error"
        );
        titleInput.focus();
        return;
    }

    submitButton.disabled = true;
    showStatus("Creating note...");

    try {
        const result = await request(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                body: body,
                userId: 1
            })
        });

        const newNote = result.data;

        // JSONPlaceholder simulates creation and does not persist
        // the new note on its server. Keep it in this browser's
        // current in-memory list so it appears until the page reloads.
        notes.unshift(newNote);
        renderNotes();

        showStatus(
            `Note created (status ${result.status}, id ${newNote.id}).`,
            "success"
        );

        noteForm.reset();
    } catch (error) {
        showStatus(
            "Unable to create the note. Please try again.",
            "error"
        );

        console.error("Creating note failed:", error);
    } finally {
        submitButton.disabled = false;
    }
}

// DELETE: Remove a note from the server
async function deleteNote(noteId, item, deleteButton) {
    deleteButton.disabled = true;
    showStatus("Deleting note...");

    try {
        const result = await request(`${API_URL}/${noteId}`, {
            method: "DELETE"
        });

        // JSONPlaceholder simulates deletion but does not really
        // persist the change. Remove the note from this browser's
        // displayed list after a successful response.
        notes = notes.filter((note) => note.id !== noteId);

        renderNotes();

        showStatus(
            `Note deleted (status ${result.status}, id ${noteId}).`,
            "success"
        );
    } catch (error) {
        deleteButton.disabled = false;

        showStatus(
            "Unable to delete the note. Please try again.",
            "error"
        );

        console.error("Deleting note failed:", error);
    }
}

// Connect the buttons and form to their functions
loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);

// Display the initial empty state
renderNotes();
