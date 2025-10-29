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
let totalProblems = 0;
let successfulProblems = 0;

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
  const sessionDuration = Math.round((new Date() - sessionStartTime) / 1000);
  const minutes = Math.floor(sessionDuration / 60);
  const seconds = sessionDuration % 60;
  const successRate =
    totalProblems > 0
      ? Math.round((successfulProblems / totalProblems) * 100)
      : 0;

  const statsEntry = `📊 Duration: ${minutes}m ${seconds}s | Exercises: ${totalProblems} | Success: ${successRate}% (${successfulProblems}/${totalProblems})`;

  const logWithStats = [sessionLog[0], statsEntry, ...sessionLog.slice(1)];
  logElement.innerHTML = logWithStats.join("<br>");
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
  const isVisible = window.getComputedStyle(logElement).display !== "none";
  logElement.style.display = isVisible ? "none" : "block";
  clipboardLabel.style.display = isVisible ? "none" : "block";

  if (!isVisible) {
    const sessionDuration = Math.round((new Date() - sessionStartTime) / 1000);
    const minutes = Math.floor(sessionDuration / 60);
    const seconds = sessionDuration % 60;
    const successRate =
      totalProblems > 0
        ? Math.round((successfulProblems / totalProblems) * 100)
        : 0;

    const statsHeader = [
      `📊 Session Statistics:`,
      `⏱️ Duration: ${minutes}m ${seconds}s`,
      `📝 Total exercises: ${totalProblems}`,
      `✅ Success rate: ${successRate}% (${successfulProblems}/${totalProblems})`,
      `---`,
    ];
    const statsText = statsHeader.join("\n") + "\n" + sessionLog.join("\n");
    navigator.clipboard
      .writeText(statsText)
      .then(() => {
        console.log("Stats copied to clipboard");
      })
      .catch((err) => {
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

window.addEventListener("beforeunload", function (e) {
  const confirmationMessage =
    "Are you sure you want to leave? Your progress will be lost.";
  e.preventDefault();
  e.returnValue = confirmationMessage;
  return confirmationMessage;
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

logEntry(`📚 Session started (${new Date().toLocaleString()})`);
generateNewProblem();
updateAnswerDisplay();
