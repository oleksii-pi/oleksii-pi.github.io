let riddles = null;

async function fetchRiddles() {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/oleksii-pi/Marichka/main/riddles.txt"
    );
    const text = await response.text();
    return text.split("* * *").map((riddle) => riddle.trim());
  } catch (error) {
    console.error("Failed to fetch riddles:", error);
    return null;
  }
}

async function get_random_riddle() {
  if (!riddles) {
    riddles = await fetchRiddles();
  }

  if (!riddles || riddles.length === 0) {
    return "No riddles available.";
  }

  const randomIndex = Math.floor(Math.random() * riddles.length);
  const riddle = riddles[randomIndex];
  console.log("Riddle: ", riddle);
  return riddle;
}
