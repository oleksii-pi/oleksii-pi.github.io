// DOM Elements
const problemElement = document.getElementById("problem");
const logElement = document.getElementById("log");
const showLogsButton = document.getElementById("showLogs");
const enterAnswerButton = document.getElementById("enterAnswer");
const answerDisplay = document.getElementById("answerDisplay");
const successEmoji = document.getElementById("successEmoji");
const levelInput = document.getElementById("levelInput");
const helpButton = document.getElementById("helpButton");
const deleteButton = document.getElementById("del");

// State variables
let currentProblem = {};
let sessionLog = [];
let startTime = null;
let typedAnswer = "";
let incorrectAttempts = 0;
let sessionStartTime = new Date();
let sessionEndTime = new Date();
let totalProblems = 0;
let successfulProblems = 0;
let currentSessionIndex = -1; // -1 means current session, 0+ means historical sessions

// Cookie functions for level persistence
function setCookie(name, value, days = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Helper function to format date as YYYY-MM-DD HH:MM:SS
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Local storage functions for session history
function saveSessionToHistory() {
  if (sessionLog.length <= 1 || totalProblems === 0) {
    return; // Don't save empty sessions
  }

  const sessions = getSessionHistory();
  const sessionData = {
    startTime: formatDateTime(sessionStartTime),
    endTime: formatDateTime(sessionEndTime),
    log: sessionLog,
    totalProblems: totalProblems,
    successfulProblems: successfulProblems,
  };

  // Replace or add current session at the beginning
  if (sessions.length > 0 && sessions[0].startTime === sessionData.startTime) {
    sessions[0] = sessionData; // Update existing session
  } else {
    sessions.unshift(sessionData); // Add new session
  }

  // Keep only last 50 sessions
  if (sessions.length > 50) {
    sessions.length = 50;
  }

  localStorage.setItem("mathProblemSessions", JSON.stringify(sessions));
}

function getSessionHistory() {
  const stored = localStorage.getItem("mathProblemSessions");
  return stored ? JSON.parse(stored) : [];
}

function displaySession(index) {
  const sessions = getSessionHistory();
  const navigationButtons = document.getElementById("navigationButtons");
  const prevButton = document.getElementById("prevSession");
  const nextButton = document.getElementById("nextSession");

  let logContent, statsForClipboard;

  if (index === -1) {
    // Current session
    const sessionDuration = Math.round(
      (sessionEndTime - sessionStartTime) / 1000
    );
    const minutes = Math.floor(sessionDuration / 60);
    const seconds = sessionDuration % 60;
    const successRate =
      totalProblems > 0
        ? Math.round((successfulProblems / totalProblems) * 100)
        : 0;

    const statsEntry = `📊 Duration: ${minutes}m ${seconds}s | Exercises: ${totalProblems} | Success: ${successRate}% (${successfulProblems}/${totalProblems})`;
    const logWithStats = [sessionLog[0], statsEntry, ...sessionLog.slice(1)];
    logContent = logWithStats.join("<br>");

    const statsHeader = [
      `📊 Session Statistics:`,
      `⏱️ Duration: ${minutes}m ${seconds}s`,
      `📝 Total exercises: ${totalProblems}`,
      `✅ Success rate: ${successRate}% (${successfulProblems}/${totalProblems})`,
      `---`,
    ];
    statsForClipboard = statsHeader.join("\n") + "\n" + sessionLog.join("\n");

    // Enable/disable buttons
    prevButton.disabled = sessions.length === 0;
    nextButton.disabled = true;
    navigationButtons.style.display = "flex";
  } else {
    // Historical session
    const session = sessions[index];
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    const sessionDuration = Math.round((end - start) / 1000);
    const minutes = Math.floor(sessionDuration / 60);
    const seconds = sessionDuration % 60;
    const successRate =
      session.totalProblems > 0
        ? Math.round((session.successfulProblems / session.totalProblems) * 100)
        : 0;

    const statsEntry = `📊 Duration: ${minutes}m ${seconds}s | Exercises: ${session.totalProblems} | Success: ${successRate}% (${session.successfulProblems}/${session.totalProblems})`;
    const logWithStats = [session.log[0], statsEntry, ...session.log.slice(1)];
    logContent = logWithStats.join("<br>");

    const statsHeader = [
      `📊 Session Statistics (${session.startTime}):`,
      `⏱️ Duration: ${minutes}m ${seconds}s`,
      `📝 Total exercises: ${session.totalProblems}`,
      `✅ Success rate: ${successRate}% (${session.successfulProblems}/${session.totalProblems})`,
      `---`,
    ];
    statsForClipboard = statsHeader.join("\n") + "\n" + session.log.join("\n");

    // Enable/disable buttons
    prevButton.disabled = index >= sessions.length - 1;
    nextButton.disabled = false; // Can always go back towards current session
    navigationButtons.style.display = "flex";
  }

  logElement.innerHTML = logContent;

  // Store for clipboard copy
  logElement.dataset.clipboardText = statsForClipboard;
}

function navigateToPreviousSession() {
  const sessions = getSessionHistory();
  if (currentSessionIndex === -1 && sessions.length > 0) {
    currentSessionIndex = 0;
  } else if (currentSessionIndex < sessions.length - 1) {
    currentSessionIndex++;
  }
  displaySession(currentSessionIndex);
}

function navigateToNextSession() {
  if (currentSessionIndex === 0) {
    currentSessionIndex = -1;
  } else if (currentSessionIndex > 0) {
    currentSessionIndex--;
  }
  displaySession(currentSessionIndex);
}

// Problem generation
function generateNewProblem() {
  const level = parseInt(levelInput.value, 10);
  let newProblem;

  do {
    newProblem = generateProblem(level);
  } while (currentProblem && newProblem.question === currentProblem.question);

  currentProblem = newProblem;
  problemElement.textContent = currentProblem.question;
  startTime = new Date();
  incorrectAttempts = 0;
}

// Logging
function logEntry(entry) {
  sessionLog.push(entry);
}

function updateLog() {
  const sessionDuration = Math.round(
    (sessionEndTime - sessionStartTime) / 1000
  );
  const minutes = Math.floor(sessionDuration / 60);
  const seconds = sessionDuration % 60;
  const successRate =
    totalProblems > 0
      ? Math.round((successfulProblems / totalProblems) * 100)
      : 0;

  const statsEntry = `📊 Duration: ${minutes}m ${seconds}s | Exercises: ${totalProblems} | Success: ${successRate}% (${successfulProblems}/${totalProblems})`;

  const logWithStats = [sessionLog[0], statsEntry, ...sessionLog.slice(1)];
  logElement.innerHTML = logWithStats.join("<br>");

  // Reset to current session when updating
  currentSessionIndex = -1;
}

function updateAnswerDisplay() {
  answerDisplay.textContent = typedAnswer;
}

function showSuccessEmoji() {
  const emojisByLevel = [
    ["🎉", "🥳", "👏", "👍", "😊", "🎈", "✨", "🌈", "🍭", "🦄"],
    ["⭐", "🌟", "💫", "🎊", "🙌", "🫶", "🤗", "🎀", "🌞", "🌼"],
    ["✅", "✔️", "☑️", "💪", "😁", "🚀", "😎", "🌟", "🎯", "🔥"],
    ["🤩", "🙌", "🏅", "🎯", "🧠", "🔓", "🔑", "📈", "🛡️", "🎖️"],
    ["🌈", "✨", "🪄", "🍀", "🧸", "🎠", "🍎", "🧮", "📚", "🎈"],
    ["🚀", "🛰️", "🛸", "🧪", "🧩", "🗝️", "⚡", "🏆", "🥇", "🎯"],
    ["💡", "🧠", "🔎", "🧩", "📘", "🔬", "🧭", "🏅", "🎯", "✅"],
    ["😎", "🔥", "🏆", "👑", "💎", "🚀", "🎯", "📈", "⭐", "💥"],
    ["🌟", "🎖️", "🏅", "🥇", "🏆", "🛡️", "⚡", "🎯", "🧠", "💪"],
    ["🏆", "🥇", "👑", "💎", "🔥", "🎯", "🚀", "🌟", "💫", "✅"],
    ["🌠", "🛸", "🚀", "🧠", "📈", "🗝️", "🔓", "🎯", "🏆", "💥"],
    ["🤓", "🧠", "📚", "🧮", "🎯", "🏅", "✅", "🚀", "🌟", "💡"],
    ["💎", "🔥", "👑", "🏆", "😎", "🪙", "🎯", "🚀", "🌟", "✅"],
    ["🏆", "👑", "💎", "🌠", "⚡", "🔥", "🎯", "🚀", "📈", "🥇"],
  ];

  const currentLevel = parseInt(levelInput.value, 10);
  const levelIndex = Math.min(currentLevel - 1, emojisByLevel.length - 1);
  const emojis = emojisByLevel[levelIndex];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

  successEmoji.textContent = randomEmoji;
  successEmoji.style.opacity = 1;
  setTimeout(() => {
    successEmoji.style.opacity = 0;
  }, 2000);
}

function checkAnswer() {
  const userAnswer = parseInt(typedAnswer, 10);
  const timeTaken = Math.round((new Date() - startTime) / 1000);

  if (isNaN(userAnswer)) {
    return;
  }

  sessionEndTime = new Date(); // Update session end time on every answer

  if (userAnswer === currentProblem.answer) {
    totalProblems++;
    successfulProblems++;
    logEntry(`✅ ${currentProblem.question} = ${userAnswer} (${timeTaken}s)`);
    answerDisplay.classList.remove("error-display");
    helpButton.style.display = "none";
    problemElement.textContent = currentProblem.question;
    typedAnswer = "";
    updateAnswerDisplay();
    showSuccessEmoji();
    generateNewProblem();
  } else {
    incorrectAttempts++;
    totalProblems++;
    logEntry(
      `❌ ${currentProblem.question} = ${userAnswer} Incorrect (${timeTaken}s)`
    );
    answerDisplay.classList.add("error-display");
    if (incorrectAttempts >= 2) {
      helpButton.style.display = "inline-block";
    }
    startTime = new Date();
  }

  updateLog();
  saveSessionToHistory(); // Save session after each answer
}

// Event Listeners
deleteButton.addEventListener("click", () => {
  typedAnswer = typedAnswer.slice(0, -1);
  answerDisplay.classList.remove("error-display");
  updateAnswerDisplay();
});

document.querySelectorAll(".num").forEach((btn) => {
  btn.addEventListener("click", () => {
    typedAnswer += btn.dataset.value;
    answerDisplay.classList.remove("error-display");
    updateAnswerDisplay();
  });
});

helpButton.addEventListener("click", () => {
  const timeTaken = Math.round((new Date() - startTime) / 1000);
  logEntry(`💡 ${currentProblem.question} = ? Help requested (${timeTaken}s)`);
  updateLog();
  problemElement.textContent = `${currentProblem.question} = ${currentProblem.answer}`;
});

enterAnswerButton.addEventListener("click", checkAnswer);

showLogsButton.addEventListener("click", () => {
  const clipboardLabel = document.getElementById("clipboardLabel");
  const navigationButtons = document.getElementById("navigationButtons");
  const isVisible = window.getComputedStyle(logElement).display !== "none";
  logElement.style.display = isVisible ? "none" : "block";
  clipboardLabel.style.display = isVisible ? "none" : "block";
  navigationButtons.style.display = isVisible ? "none" : "flex";

  if (!isVisible) {
    currentSessionIndex = -1; // Reset to current session
    displaySession(currentSessionIndex);

    // Copy to clipboard
    const statsText = logElement.dataset.clipboardText || "";
    navigator.clipboard.writeText(statsText).catch((err) => {
      console.error("Failed to copy stats to clipboard:", err);
    });
  }
});

document.getElementById("increaseLevel").addEventListener("click", () => {
  const currentLevel = parseInt(levelInput.value, 10);
  if (currentLevel < getLevelCount()) {
    levelInput.value = currentLevel + 1;
    setCookie("mathProblemLevel", levelInput.value);
    generateNewProblem();
  }
});

document.getElementById("decreaseLevel").addEventListener("click", () => {
  const currentLevel = parseInt(levelInput.value, 10);
  if (currentLevel > 1) {
    levelInput.value = currentLevel - 1;
    setCookie("mathProblemLevel", levelInput.value);
    generateNewProblem();
  }
});

let startY = null;

document.addEventListener(
  "touchstart",
  function (e) {
    startY = e.touches[0].clientY;
  },
  { passive: true }
);

document.addEventListener(
  "touchmove",
  function (e) {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;

    if (window.scrollY === 0 && deltaY > 0) {
      e.preventDefault();
    }
  },
  { passive: false }
);

document.addEventListener("keydown", function (e) {
  if (e.code === "Space") {
    e.preventDefault();
    generateNewProblem();
  }
});

// Initialization
levelInput.max = getLevelCount();

const savedLevel = getCookie("mathProblemLevel");
if (savedLevel && savedLevel >= 1 && savedLevel <= getLevelCount()) {
  levelInput.value = savedLevel;
}

// Set up navigation buttons
document
  .getElementById("prevSession")
  .addEventListener("click", navigateToPreviousSession);
document
  .getElementById("nextSession")
  .addEventListener("click", navigateToNextSession);
document.getElementById("copyAllSessions").addEventListener("click", () => {
  const sessions = getSessionHistory();

  navigator.clipboard
    .writeText(JSON.stringify(sessions, null, 2))
    .then(() => {
      alert("All sessions copied to clipboard!");
    })
    .catch((err) => {
      alert("Failed to copy to clipboard");
    });
});

logEntry(`📚 Session started (${formatDateTime(new Date())})`);
generateNewProblem();
updateAnswerDisplay();
