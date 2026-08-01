/*==================== TASKFLOW DASHBOARD ====================*/
const $ = id => document.getElementById(id);

const taskInput = $("taskInput"),
      startDate = $("startDate"),
      startTime = $("startTime"),
      deadlineDate = $("deadlineDate"),
      deadlineTime = $("deadlineTime"),
      priority = $("priority"),
      category = $("category"),
      repeatTask = $("repeatTask"),
      taskTags = $("taskTags"),
      taskNotes = $("taskNotes"),
      taskAttachments = $("taskAttachments"),
      addTaskBtn = $("addTaskBtn"),
      taskList = $("taskList"),
      searchInput = $("searchInput"),
      categoryFilter = $("categoryFilter"),
      tagFilter = $("tagFilter"),
      statusFilter = $("statusFilter"),
      sortTasks = $("sortTasks"),
      totalTasks = $("totalTasks"),
      completedTasks = $("completedTasks"),
      pendingTasks = $("pendingTasks"),
      themeToggle = $("themeToggle"),
      exportPdf = $("exportPdf"),
      exportJson = $("exportJson"),
      importJson = $("importJson"),
      importJsonBtn = $("importJsonBtn"),
      clearCompletedBtn = $("clearCompletedBtn"),
      chartCanvas = null,
      toast = $("toast"),
      actionsBtn = $("actionsBtn"),
      actionsMenu = $("actionsMenu"),
      notificationBtn = $("notificationBtn"),
      notifBadge = $("notifBadge"),
      calPrev = $("calPrev"),
      calNext = $("calNext"),
      calLabel = $("calLabel"),
      calendarGrid = $("calendarGrid"),
      projectNameInput = $("projectNameInput"),
      projectIconInput = $("projectIconInput"),
      projectColorInput = $("projectColorInput"),
      addProjectBtn = $("addProjectBtn");

let tasks = [];
let activities = [];
let currentStreak = 0;
let allCompleteCelebrated = false;
let calViewDate = new Date();
let draggedTask = null;
let selectedDate = "";

