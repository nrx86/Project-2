const taskInput = document.getElementById("taskInput");
const taskDateInput = document.getElementById("taskDate");
const taskTimeInput = document.getElementById("taskTime");
const taskPrioritySelect = document.getElementById("taskPriority");
const taskSearchInput = document.getElementById("taskSearch");
const taskList = document.getElementById("taskList");
const addTaskBtn = document.getElementById("addTaskBtn");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const taskCount = document.getElementById("taskCount");
const filterButtons = document.querySelectorAll(".filter-btn");
const themeToggle = document.getElementById("themeToggle");

let tasks = [];
let activeFilter = "all";
let searchTerm = "";
let theme = localStorage.getItem("theme") || "dark";

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function saveTheme() {
  localStorage.setItem("theme", theme);
}

function applyTheme(nextTheme) {
  theme = nextTheme;
  document.body.classList.toggle("light-theme", theme === "light");
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  saveTheme();
}

function loadTasks() {
  tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  applyTheme(theme);
  renderTasks();
}

function getFilteredTasks() {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return tasks.reduce((result, task, index) => {
    const matchesFilter =
      (activeFilter === "all") ||
      (activeFilter === "active" && !task.completed) ||
      (activeFilter === "completed" && task.completed);

    const matchesSearch =
      normalizedSearch === "" || task.text.toLowerCase().includes(normalizedSearch);

    if (matchesFilter && matchesSearch) {
      result.push({ task, index });
    }

    return result;
  }, []);
}

function updateTaskCount() {
  const remaining = tasks.filter((task) => !task.completed).length;
  taskCount.textContent = `${remaining} ${remaining === 1 ? "task" : "tasks"} left`;
}

function startEditing(index, taskTextEl) {
  const currentText = tasks[index].text;
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentText;
  input.className = "edit-input";

  const parent = taskTextEl.parentElement;
  parent.replaceChild(input, taskTextEl);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  const finishEditing = () => {
    const newValue = input.value.trim();
    if (newValue) {
      tasks[index].text = newValue;
    } else {
      tasks[index].text = currentText;
    }
    saveTasks();
    renderTasks();
  };

  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      finishEditing();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      tasks[index].text = currentText;
      saveTasks();
      renderTasks();
    }
  });

  input.addEventListener("blur", finishEditing);
}

function createTaskElement(task, index) {
  const li = document.createElement("li");
  li.className = "task-item";

  if (task.completed) {
    li.classList.add("completed");
  }

  const taskMain = document.createElement("div");
  taskMain.className = "task-main";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.addEventListener("change", function () {
    tasks[index].completed = checkbox.checked;
    saveTasks();
    renderTasks();
  });

  const taskContent = document.createElement("div");
  taskContent.className = "task-content";

  const taskTextEl = document.createElement("span");
  taskTextEl.className = "task-text";
  taskTextEl.textContent = task.text;
  taskTextEl.addEventListener("dblclick", function () {
    startEditing(index, taskTextEl);
  });

  const meta = document.createElement("div");
  meta.className = "task-meta";

  if (task.dueDate || task.dueTime) {
    const dueBadge = document.createElement("span");
    dueBadge.className = "due-badge";
    dueBadge.textContent = `Due ${task.dueDate || ""} ${task.dueTime || ""}`.trim();
    meta.appendChild(dueBadge);
  }

  if (task.priority) {
    const priorityBadge = document.createElement("span");
    priorityBadge.className = `priority-badge priority-${task.priority.toLowerCase()}`;
    priorityBadge.textContent = task.priority;
    meta.appendChild(priorityBadge);
  }

  taskContent.appendChild(taskTextEl);
  if (meta.childNodes.length) {
    taskContent.appendChild(meta);
  }

  taskMain.appendChild(checkbox);
  taskMain.appendChild(taskContent);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "icon-btn";
  editBtn.type = "button";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", function () {
    startEditing(index, taskTextEl);
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "icon-btn danger";
  deleteBtn.type = "button";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", function () {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  });

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  li.appendChild(taskMain);
  li.appendChild(actions);
  return li;
}

function renderTasks() {
  taskList.innerHTML = "";

  const filteredTasks = getFilteredTasks();

  if (filteredTasks.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.textContent =
      activeFilter === "completed"
        ? "No completed tasks yet."
        : activeFilter === "active"
          ? "No active tasks right now."
          : searchTerm
            ? "No tasks match your search."
            : "No tasks yet. Add one above!";
    taskList.appendChild(emptyState);
  } else {
    filteredTasks.forEach(({ task, index }) => {
      taskList.appendChild(createTaskElement(task, index));
    });
  }

  updateTaskCount();
}

function addTask() {
  const taskText = taskInput.value.trim();

  if (!taskText) {
    taskInput.focus();
    return;
  }

  tasks.unshift({
    text: taskText,
    completed: false,
    dueDate: taskDateInput.value,
    dueTime: taskTimeInput.value,
    priority: taskPrioritySelect.value
  });

  taskInput.value = "";
  taskDateInput.value = "";
  taskTimeInput.value = "";
  taskPrioritySelect.value = "Medium";
  taskInput.focus();
  saveTasks();
  renderTasks();
}

function clearCompletedTasks() {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
}

function setFilter(filter) {
  activeFilter = filter;
  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
  renderTasks();
}

addTaskBtn.addEventListener("click", addTask);

clearCompletedBtn.addEventListener("click", clearCompletedTasks);

filterButtons.forEach((button) => {
  button.addEventListener("click", function () {
    setFilter(button.dataset.filter);
  });
});

taskInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    addTask();
  }
});

taskSearchInput.addEventListener("input", function (event) {
  searchTerm = event.target.value;
  renderTasks();
});

themeToggle.addEventListener("click", function () {
  applyTheme(theme === "dark" ? "light" : "dark");
});

window.addEventListener("DOMContentLoaded", loadTasks);
