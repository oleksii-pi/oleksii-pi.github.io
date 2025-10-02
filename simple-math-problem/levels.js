// Math Problem Generator - 10 Levels based on given examples

function getLevelCount() {
  return 10;
}

function randInt(min, max) {
  // inclusive
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProblem(level) {
  let currentProblem = {};

  if (level === 1) {
    // Level 1: Addition with result < 10
    // Examples: 1+2, 2+3, 4+1, 5+2 (avoid sums of 10)
    const a = randInt(1, 8);
    const b = randInt(1, 9 - a); // ensures a + b <= 9
    currentProblem = { question: `${a} + ${b}`, answer: a + b };
  } else if (level === 2) {
    // Level 2: Subtraction, first number <= 5 (positive result)
    // Examples: 4-1, 4-2, 3-2, 2-1, 5-4
    const minuend = randInt(2, 5);
    const subtrahend = randInt(1, minuend - 1);
    currentProblem = {
      question: `${minuend} - ${subtrahend}`,
      answer: minuend - subtrahend,
    };
  } else if (level === 3) {
    // Level 3: Addition where sum > 10
    // Examples: 9+1, 9+9, 7+5
    // Use single digits 1..9 with sum >= 11
    let a = randInt(1, 9);
    let b = randInt(Math.max(1, 11 - a), 9);
    currentProblem = { question: `${a} + ${b}`, answer: a + b };
  } else if (level === 4) {
    // Level 4: Subtraction, first number > 10 (positive result)
    // Examples: 12-3, 14-5, 13-8, 18-9, 19-9, 16-3
    const minuend = randInt(11, 30);
    const subtrahend = randInt(1, minuend - 1);
    currentProblem = {
      question: `${minuend} - ${subtrahend}`,
      answer: minuend - subtrahend,
    };
  } else if (level === 5) {
    // Level 5: Multiplication, both numbers <= 5, avoid multiplying by 1
    // Examples: 2*2, 2*5, 5*5
    const a = randInt(2, 5);
    const b = randInt(2, 5);
    currentProblem = { question: `${a} × ${b}`, answer: a * b };
  } else if (level === 6) {
    // Level 6: Two-digit + two-digit, result < 100
    // Examples: 12+32, 78+12, 89+5 (89+5 uses one-digit in example; we keep both two-digit per rule)
    const left = randInt(10, 89); // ensures room for right >=10 and sum < 100
    const right = randInt(10, 99 - left);
    currentProblem = { question: `${left} + ${right}`, answer: left + right };
  } else if (level === 7) {
    // Level 7: Two-digit − two-digit, result > 0
    // Examples: 32-13, 89-46
    const a = randInt(10, 99);
    const b = randInt(10, a - 1); // ensure positive result
    currentProblem = { question: `${a} - ${b}`, answer: a - b };
  } else if (level === 8) {
    // Level 8: Division, first number < 30, second is single digit (2..9), integer result
    // Examples: 6:3, 8:4, 20:5, 25:5, 14:2
    const divisor = randInt(2, 9);
    const maxQuot = Math.floor(29 / divisor);
    const quotient = randInt(1, Math.max(1, maxQuot));
    const dividend = divisor * quotient; // guaranteed < 30
    currentProblem = { question: `${dividend} : ${divisor}`, answer: quotient };
  } else if (level === 9) {
    // Level 9: Multiplication, both numbers in 5..9
    // Examples: 5*6, 6*9, 9*5
    const a = randInt(5, 9);
    const b = randInt(5, 9);
    currentProblem = { question: `${a} × ${b}`, answer: a * b };
  } else if (level === 10) {
    // Level 10: Any multiplication or division for numbers 1..9
    // For division, ensure integer result.
    const isMultiplication = Math.random() < 0.5;
    if (isMultiplication) {
      const a = randInt(1, 9);
      const b = randInt(1, 9);
      currentProblem = { question: `${a} × ${b}`, answer: a * b };
    } else {
      const divisor = randInt(1, 9);
      const quotient = randInt(1, 9);
      const dividend = divisor * quotient;
      currentProblem = {
        question: `${dividend} : ${divisor}`,
        answer: quotient,
      };
    }
  } else {
    // Fallback (shouldn't happen if level is 1..10)
    const a = randInt(1, 9);
    const b = randInt(1, 9);
    currentProblem = { question: `${a} + ${b}`, answer: a + b };
  }

  return currentProblem;
}
