// Import our custom CSS
import '../scss/styles.scss'

// // Import all of Bootstrap's JS
import * as bootstrap from 'bootstrap'


// i need all reference

const API_URL = "http://localhost:4000/api/todos";

const taskList = document.getElementById("taskList");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskTitle = document.getElementById("taskTitle");
const taskPriority = document.getElementById("taskPriority");
const searchInput = document.getElementById("searchInput");

// Edit modal elements
const editTaskModal = new bootstrap.Modal(document.getElementById("editTaskModal"));
const editTaskTitle = document.getElementById("editTaskTitle");
const editTaskPriority = document.getElementById("editTaskPriority");
const saveEditBtn = document.getElementById("saveEditBtn");
let currentEditId = null;
let currentFilter = 'all';
let currentImportant = 'low';

let tasks = [];

// Fetch tasks from server
async function fetchTasks() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) {
            console.error("Failed to fetch tasks with status:", res.status);
            tasks = [];
            return;
        }
        const data = await res.json(); // if data will have
        if (data && Array.isArray(data.todos)) {
            tasks = data.todos;
        } else {
            console.error("API response format is incorrect:", data);
            tasks = [];
        }
        renderTasks();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        tasks = [];
        renderTasks();
    }
}

// Render tasks
function renderTasks() {
    if (!Array.isArray(tasks)) {
        console.error("tasks is not an array:", tasks);
        return;
    }

    const searchText = searchInput.value.toLowerCase();
    taskList.innerHTML = "";

    tasks
        .filter(t => {
            // filter by task 
            const statusMatch = (currentFilter === 'all') ||
                (currentFilter === 'pending' && !t.isCompleted) ||
                (currentFilter === 'completed' && t.isCompleted);

            // Filter by importance
            const importanceMatch = (currentImportant === 'low') ||
                (currentImportant === t.isImportant);

            return statusMatch && importanceMatch;

        })

        .filter(t => t.title.toLowerCase().includes(searchText))
        .forEach(t => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";

            const priorityBadgeClass = t.isImportant === 'High' ? 'bg-danger' : t.isImportant === 'Medium' ? 'bg-warning text-dark' : 'bg-secondary';
            const completedClass = t.isCompleted ? 'text-decoration-line-through' : '';

            li.innerHTML = `
                <div>
                    <input type="checkbox" class="form-check-input me-2" data-task-id="${t.id}">
                    <span class="${completedClass}">${t.title}</span>
                    <span class="badge ${priorityBadgeClass} ms-2">${t.isImportant}</span>
                    <small class="text-muted ms-2">Created: ${new Date(t.updatedAt).toLocaleString()}</small>
                </div>
                <div>
                    <button class="btn btn-sm btn-info me-2 edit-btn" data-task-id="${t.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-task-id="${t.id}">Delete</button>
                </div>
            `;

            // Checkbox
            const checkbox = li.querySelector("input[type=checkbox]");
            checkbox.checked = t.isCompleted;
            checkbox.addEventListener("change", () => toggleComplete(t.id, checkbox.checked));

            // Edit button
            li.querySelector("button.btn-info").addEventListener("click", () => openEditModal(t.id));

            // Delete button
            li.querySelector("button.btn-danger").addEventListener("click", () => deleteTask(t.id));

            taskList.appendChild(li);
        });
}

// Add Task
addTaskBtn.addEventListener("click", async () => {
    const title = taskTitle.value.trim();
    const isImportant = taskPriority.value;
    if (!title) return alert("Task title is required");

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, isImportant, isCompleted: false })
        });
        if (!res.ok) throw new Error("Failed to add task");
        taskTitle.value = "";
        fetchTasks();
    } catch (error) {
        console.error('Error adding task:', error);
    }
});


// Toggle Complete
async function toggleComplete(id, completed) {
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isCompleted: completed })
        });
        if (!res.ok) throw new Error(`Failed to update task with status: ${res.status}`);
        fetchTasks();
    } catch (error) {
        console.error('Error updating task:', error);
        alert(error.message);
    }
}

// Delete Task
async function deleteTask(id) {
    if (!confirm("Delete this task?")) return;
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`Failed to delete task with status: ${res.status}`);
        fetchTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
        alert(error.message);
    }
}

// Open Edit Modal
function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        currentEditId = id;
        editTaskTitle.value = task.title;
        editTaskPriority.value = task.isImportant;
        editTaskModal.show();
    }
}
// error
// Save Edit
saveEditBtn.addEventListener("click", async () => {
    const updatedTitle = editTaskTitle.value.trim();
    const updatedPriority = editTaskPriority.value;
    if (!updatedTitle) return alert("Task title is required");

    try {
        const res = await fetch(`${API_URL}/${currentEditId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: updatedTitle, isImportant: updatedPriority })
        });

        if (!res.ok) throw new Error(`Failed to update task with status: ${res.status}`);

        editTaskModal.hide();
        fetchTasks();
    } catch (error) {
        console.error('Error saving task edit:', error);
        alert(error.message);
    }
});

// Search
searchInput.addEventListener("input", fetchTasks);

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    // Get filter buttons after DOM is loaded
    const filterButtons = document.querySelectorAll('.btn-group .btn');
    const filterImportant = document.querySelectorAll(".data-filter-importance");
    // Filter functionality
    filterButtons.forEach(button => { // got all the button
        button.addEventListener('click', (e) => {
            // Update the active button class 
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            // Update the filter state and re-render
            currentFilter = e.target.dataset.filter;
            renderTasks();
        });
    });
    filterImportant.forEach(button => {
        button.addEventListener('click', (e) => {
            filterImportant.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            // Update the filter state and re-render
            currentImportant = e.target.dataset.filter;
            renderTasks();
        });
    })
    fetchTasks();

});
