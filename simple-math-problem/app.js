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
const showMistakesButton = document.getElementById("showMistakes");
const mistakesModal = document.getElementById("mistakesModal");
const pastSessionCountLabel = document.getElementById("pastSessionCount");
const practiceTasksTextArea = document.getElementById("practiceTasksTextArea");
const applyMistakesButton = document.getElementById("applyMistakes");
const cancelMistakesButton = document.getElementById("cancelMistakes");
const increasePastSessionsButton = document.getElementById(
  "increasePastSessions"
);
const decreasePastSessionsButton = document.getElementById(
  "decreasePastSessions"
);

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
let currentSessionIndex = 0;
let isPracticingMistakes = false;
let practiceTasks = [];
let currentPracticeIndex = 0;
let pastSessionCount = 1;

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
  const sessionDuration = Math.round(
    (sessionEndTime - sessionStartTime) / 1000
  );
  const minutes = Math.floor(sessionDuration / 60);
  const seconds = sessionDuration % 60;
  const durationFormatted = `${minutes}:${String(seconds).padStart(2, "0")}`;
  const successRatePercent =
    totalProblems > 0
      ? Math.round((successfulProblems / totalProblems) * 100)
      : 0;
  const successRateFormatted = `${successRatePercent}% (${successfulProblems}/${totalProblems})`;

  const sessionData = {
    startTime: formatDateTime(sessionStartTime),
    endTime: formatDateTime(sessionEndTime),
    duration: durationFormatted,
    exercises: totalProblems,
    successRate: successRateFormatted,
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
  const deleteButton = document.getElementById("deleteSession");
  const copyAllButton = document.getElementById("copyAllSessions");

  let logContent, statsForClipboard;

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
  nextButton.disabled = index == 0;
  navigationButtons.style.display = "flex";
  deleteButton.style.display = "block";

  // Update "Copy all" button text with session count
  copyAllButton.textContent = `Copy all (${sessions.length})`;

  logElement.innerHTML = logContent;

  // Store for clipboard copy
  logElement.dataset.clipboardText = statsForClipboard;
}

function navigateToPreviousSession() {
  const sessions = getSessionHistory();
  if (currentSessionIndex < sessions.length) {
    currentSessionIndex++;
    displaySession(currentSessionIndex);
  }
}

function navigateToNextSession() {
  if (currentSessionIndex > 0) {
    currentSessionIndex--;
    displaySession(currentSessionIndex);
  }
}

// Problem generation
function generateNewProblem() {
  if (isPracticingMistakes && practiceTasks.length > 0) {
    // Practice mode: pick a random task from the practice list
    let randomIndex;
    let selectedProblem;

    // If there's more than 1 task, ensure we don't pick the same one as before
    if (practiceTasks.length > 1) {
      do {
        randomIndex = Math.floor(Math.random() * practiceTasks.length);
        selectedProblem = practiceTasks[randomIndex];
      } while (
        currentProblem &&
        selectedProblem.question === currentProblem.question
      );
    } else {
      randomIndex = 0;
      selectedProblem = practiceTasks[randomIndex];
    }

    currentProblem = selectedProblem;
    problemElement.textContent = currentProblem.question;
    startTime = new Date();
    incorrectAttempts = 0;
    return;
  }

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
  currentSessionIndex = 0;
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
  const deleteButton = document.getElementById("deleteSession");
  const isVisible = window.getComputedStyle(logElement).display !== "none";
  logElement.style.display = isVisible ? "none" : "block";
  clipboardLabel.style.display = isVisible ? "none" : "block";
  navigationButtons.style.display = isVisible ? "none" : "flex";
  deleteButton.style.display = isVisible ? "none" : "block";

  if (!isVisible) {
    currentSessionIndex = 0; // Reset to current session
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
document.getElementById("copySession").addEventListener("click", () => {
  const statsText = logElement.dataset.clipboardText || "";
  navigator.clipboard
    .writeText(statsText)
    .then(() => {
      alert("Current session copied to clipboard!");
    })
    .catch((err) => {
      alert("Failed to copy to clipboard");
      console.error(err);
    });
});
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

document.getElementById("deleteSession").addEventListener("click", () => {
  const sessions = getSessionHistory();
  const session = sessions[currentSessionIndex];

  const userInput = prompt(
    `Are you sure you want to delete this session?\n\nSession: ${session.startTime}\nExercises: ${session.totalProblems}\nSuccess rate: ${session.successRate}\n\nType "delete" to confirm:`
  );

  if (userInput === "delete") {
    // Remove the session from the array
    sessions.splice(currentSessionIndex, 1);

    // Save updated sessions
    localStorage.setItem("mathProblemSessions", JSON.stringify(sessions));

    // Adjust current index if needed
    if (currentSessionIndex >= sessions.length && sessions.length > 0) {
      currentSessionIndex = sessions.length - 1;
    }

    // Refresh display or hide if no sessions left
    if (sessions.length > 0) {
      displaySession(currentSessionIndex);
    } else {
      logElement.style.display = "none";
      document.getElementById("clipboardLabel").style.display = "none";
      document.getElementById("navigationButtons").style.display = "none";
      document.getElementById("deleteSession").style.display = "none";
      alert("All sessions have been deleted.");
    }
  }
});

// Mistakes practice functionality
function extractMistakesFromSessions(numSessions) {
  const sessions = getSessionHistory();
  const mistakes = [];

  for (let i = 0; i < Math.min(numSessions, sessions.length); i++) {
    const session = sessions[i];
    session.log.forEach((entry) => {
      if (entry.startsWith("❌")) {
        // Extract the problem from the log entry
        // Format: ❌ 2x2 = 5 Incorrect (3s)
        const match = entry.match(/❌\s+(.+?)\s+=\s+\d+\s+Incorrect/);
        if (match) {
          let question = match[1].trim();
          // Normalize the question format by replacing × with x for consistency
          question = question.replace(/×/g, "x");
          mistakes.push(question);
        }
      }
    });
  }

  return [...new Set(mistakes)]; // Remove duplicates
}

function parsePracticeTasks(tasksText) {
  const tasks = [];
  const entries = tasksText
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e);

  entries.forEach((entry) => {
    // Parse format: 2x2=4, 3 × 7=21, 56:7=8, 4 + 4=8
    const match = entry.match(/^(.+?)\s*=\s*(\d+)$/);
    if (match) {
      let question = match[1].trim();
      const answer = parseInt(match[2], 10);

      // Normalize the question format by replacing × with x for consistency
      question = question.replace(/×/g, "x");

      tasks.push({ question, answer });
    }
  });

  return tasks;
}

function formatPracticeTasksForTextarea(mistakes) {
  return mistakes
    .map((q) => {
      // Parse the question to get the answer
      try {
        // Replace operators for eval: x or × -> *, : -> /
        const evalExpression = q.replace(/x|×/g, "*").replace(/:/g, "/");
        const answer = eval(evalExpression);
        return `${q}=${answer}`;
      } catch (e) {
        return q;
      }
    })
    .join(", ");
}

showMistakesButton.addEventListener("click", () => {
  const isVisible = mistakesModal.style.display === "block";

  if (isVisible) {
    mistakesModal.style.display = "none";
  } else {
    // Load mistakes from past sessions
    const mistakes = extractMistakesFromSessions(pastSessionCount);
    practiceTasksTextArea.value = formatPracticeTasksForTextarea(mistakes);
    mistakesModal.style.display = "block";
    logElement.style.display = "none";
    document.getElementById("clipboardLabel").style.display = "none";
    document.getElementById("navigationButtons").style.display = "none";
    document.getElementById("deleteSession").style.display = "none";
  }
});

cancelMistakesButton.addEventListener("click", () => {
  mistakesModal.style.display = "none";
});

increasePastSessionsButton.addEventListener("click", () => {
  const sessions = getSessionHistory();
  if (pastSessionCount < sessions.length) {
    pastSessionCount++;
    pastSessionCountLabel.textContent = pastSessionCount;
    // Reload mistakes with new count
    const mistakes = extractMistakesFromSessions(pastSessionCount);
    practiceTasksTextArea.value = formatPracticeTasksForTextarea(mistakes);
  }
});

decreasePastSessionsButton.addEventListener("click", () => {
  if (pastSessionCount > 1) {
    pastSessionCount--;
    pastSessionCountLabel.textContent = pastSessionCount;
    // Reload mistakes with new count
    const mistakes = extractMistakesFromSessions(pastSessionCount);
    practiceTasksTextArea.value = formatPracticeTasksForTextarea(mistakes);
  }
});

applyMistakesButton.addEventListener("click", () => {
  const tasksText = practiceTasksTextArea.value.trim();

  if (!tasksText) {
    alert("Please add some practice tasks!");
    return;
  }

  practiceTasks = parsePracticeTasks(tasksText);

  if (practiceTasks.length === 0) {
    alert("No valid tasks found. Please use format: 2x2=4, 3x3=9, 56:7=8");
    return;
  }

  // Enter practice mode
  isPracticingMistakes = true;
  mistakesModal.style.display = "none";
  showMistakesButton.style.backgroundColor = "#28a745";
  showMistakesButton.style.color = "white";

  // Disable level selection
  document.getElementById("decreaseLevel").disabled = true;
  document.getElementById("increaseLevel").disabled = true;
  levelInput.disabled = true;

  // Reset session for practice
  sessionLog = [];
  sessionStartTime = new Date();
  totalProblems = 0;
  successfulProblems = 0;

  logEntry(
    `📚 Practicing mistakes from the last ${pastSessionCount} sessions (${formatDateTime(
      new Date()
    )})`
  );
  updateLog();

  generateNewProblem();
});

// Add click handler to exit practice mode when clicking Mistakes button again while in practice mode
const originalShowMistakesHandler = showMistakesButton.onclick;
showMistakesButton.addEventListener("click", () => {
  if (isPracticingMistakes) {
    // Exit practice mode
    isPracticingMistakes = false;
    practiceTasks = [];
    showMistakesButton.style.backgroundColor = "";
    showMistakesButton.style.color = "";

    // Re-enable level selection
    document.getElementById("decreaseLevel").disabled = false;
    document.getElementById("increaseLevel").disabled = false;
    levelInput.disabled = false;

    // Save current practice session
    saveSessionToHistory();

    // Reset session
    sessionLog = [];
    sessionStartTime = new Date();
    totalProblems = 0;
    successfulProblems = 0;

    logEntry(`📚 Session started (${formatDateTime(new Date())})`);
    updateLog();

    generateNewProblem();
  }
});

logEntry(`📚 Session started (${formatDateTime(new Date())})`);
generateNewProblem();
updateAnswerDisplay();
