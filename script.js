
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priority");
const dueDateInput = document.getElementById("dueDate");

const todoList = document.getElementById("todoList");
const doneList = document.getElementById("doneList");
const deleteAllBtn = document.getElementById("deleteAllBtn");

let tasks = [];

try {
  const savedTasks = JSON.parse(
    localStorage.getItem("mission4Tasks") || "[]"
  );

  if (Array.isArray(savedTasks)) {
    tasks = savedTasks.filter(task =>
      task &&
      typeof task.id === "string" &&
      typeof task.text === "string" &&
      typeof task.completed === "boolean" &&
      ["Low", "Medium", "High"].includes(task.priority)
    );
  }
} catch (error) {
  tasks = [];
}

function saveTasks() {
  try {
    localStorage.setItem("mission4Tasks", JSON.stringify(tasks));
  } catch (error) {
    alert("Data gagal disimpan. Periksa penyimpanan browser.");
  }
}

function updateDate() {
  const now = new Date();

  document.getElementById("today").textContent =
    new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(now);
}

function formatDate(dateString) {
  if (!dateString) return "Tidak ditentukan";

  const [year, month, day] = dateString.split("-").map(Number);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;

  return task.dueDate < getTodayString();
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function createTaskCard(task) {
  const card = createElement("article", "task-card");

  const top = createElement("div", "task-top");
  const details = createElement("div", "task-details");
  const name = createElement("p", "task-name", task.text);

  
  const createdAt = task.createdAt
    ? new Date(task.createdAt)
    : null;

  const createdAtText = createdAt && !isNaN(createdAt.getTime())
    ? `Dibuat: ${createdAt.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      })} pukul ${createdAt.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
      })}`
    : "Waktu pembuatan tidak tersedia";

  const createdDate = createElement(
    "p",
    "task-date",
    createdAtText
  );

  const dateText = task.dueDate
    ? `Batas waktu: ${formatDate(task.dueDate)}`
    : "Batas waktu belum ditentukan";

  const date = createElement("p", "task-date", dateText);

  details.append(name, createdDate, date);


  const priorityClass = {
    Low: "priority-low",
    Medium: "priority-medium",
    High: "priority-high"
  }[task.priority];

  const badge = createElement(
    "span",
    `badge ${priorityClass}`,
    task.priority
  );

  top.append(details, badge);

  const bottom = createElement("div", "task-bottom");
  const label = createElement("label", "complete-label");
  const checkbox = document.createElement("input");

  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute(
    "aria-label",
    `Tandai ${task.text} sebagai selesai`
  );

  checkbox.addEventListener("change", () => {
    task.completed = checkbox.checked;
    saveTasks();
    renderTasks();
  });

  const labelText = createElement(
    "span",
    "",
    task.completed ? "Selesai" : "Tandai selesai"
  );

  label.append(checkbox, labelText);

  const actions = createElement("div", "task-actions");

  if (isOverdue(task)) {
    const lateLabel = createElement("span", "overdue", "Overdue");
    actions.append(lateLabel);
  }

  const deleteButton = createElement(
    "button",
    "delete-btn",
    "Hapus"
  );

  deleteButton.type = "button";
  deleteButton.addEventListener("click", () => {
    if (confirm("Yakin ingin menghapus tugas ini?")) {
      tasks = tasks.filter(item => item.id !== task.id);
      saveTasks();
      renderTasks();
    }
  });

  actions.append(deleteButton);
  bottom.append(label, actions);
  card.append(top, bottom);

  return card;
}

function renderTasks() {
  todoList.replaceChildren();
  doneList.replaceChildren();

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  // Urutkan tugas aktif berdasarkan prioritas dan tenggat waktu.
  const priorityOrder = {
    High: 1,
    Medium: 2,
    Low: 3
  };

  pendingTasks.sort((a, b) => {
    const priorityDifference =
      priorityOrder[a.priority] - priorityOrder[b.priority];

    if (priorityDifference !== 0) return priorityDifference;

    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;

    return a.dueDate.localeCompare(b.dueDate);
  });

  pendingTasks.forEach(task => {
    todoList.append(createTaskCard(task));
  });

  completedTasks.forEach(task => {
    doneList.append(createTaskCard(task));
  });

  if (pendingTasks.length === 0) {
    todoList.append(
      createElement("div", "empty-state", "Belum ada tugas aktif. Tambahkan tugas baru!")
    );
  }

  if (completedTasks.length === 0) {
    doneList.append(
      createElement("div", "empty-state", "Tugas yang selesai akan muncul di sini.")
    );
  }

  document.getElementById("activeCount").textContent =
    pendingTasks.length;

  document.getElementById("doneCount").textContent =
    completedTasks.length;

  document.getElementById("lateCount").textContent =
    pendingTasks.filter(isOverdue).length;

  document.getElementById("todoCount").textContent =
    pendingTasks.length;

  document.getElementById("doneListCount").textContent =
    completedTasks.length;
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const text = taskInput.value.trim();

  if (!text) {
    alert("Silakan tulis tugas terlebih dahulu.");
    taskInput.focus();
    return;
  }

  const newTask = {
    id: crypto.randomUUID(),
    text,
    priority: priorityInput.value,
    dueDate: dueDateInput.value,
    createdAt: new Date().toISOString(),
    completed: false
  };

  tasks.push(newTask);

  saveTasks();
  renderTasks();

  taskForm.reset();
  priorityInput.value = "Medium";
  taskInput.focus();
});

deleteAllBtn.addEventListener("click", () => {
  if (tasks.length === 0) {
    alert("Belum ada tugas untuk dihapus.");
    return;
  }

  if (confirm("Hapus SEMUA tugas, termasuk yang sudah selesai?")) {
    tasks = [];
    saveTasks();
    renderTasks();
  }
});

updateDate();
renderTasks();

// Perbarui status overdue ketika tanggal berganti.
setInterval(() => {
  updateDate();
  renderTasks();
}, 60000);
