// Math Problem Generator

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const levelGenerators = [
  // Age 6
  // Addition with result < 10
  // Examples: 1+2, 2+3, 4+1, 5+2
  function () {
    const a = randInt(1, 5); // ensures a <= 5
    const b = randInt(1, Math.min(5, 10 - a)); // ensures both a <= 5, b <= 5, and a + b <= 10
    return { question: `${a} + ${b}`, answer: a + b };
  },

  // Age 6
  // Subtraction, first number <= 5 (positive result or 0)
  // Examples: 4-1, 4-2, 3-3, 2-1, 5-4
  function () {
    const minuend = randInt(2, 5);
    const subtrahend = randInt(1, minuend);
    return {
      question: `${minuend} - ${subtrahend}`,
      answer: minuend - subtrahend,
    };
  },

  // Age 6
  // Addition with numbers <= 9 and result <= 10
  // Examples: 1+9, 2+8, 3+7, 4+6, 5+5, 6+4, 7+3, 8+2, 9+1
  function () {
    const a = randInt(1, 9);
    const b = randInt(1, Math.min(9, 10 - a)); // ensures both a <= 9, b <= 9, and a + b <= 10
    return { question: `${a} + ${b}`, answer: a + b };
  },

  // Age 6
  // Subtraction with numbers <= 10 (positive result or 0)
  // Examples: 10-3, 8-8, 9-2, 7-6, 10-1
  function () {
    const minuend = randInt(6, 10);
    const subtrahend = randInt(1, minuend);
    return {
      question: `${minuend} - ${subtrahend}`,
      answer: minuend - subtrahend,
    };
  },

  // Age 7
  // Addition where result > 10
  // Examples: 9+1, 9+9, 7+5
  function () {
    let a = randInt(1, 9);
    let b = randInt(Math.max(1, 11 - a), 9);
    return { question: `${a} + ${b}`, answer: a + b };
  },

  // Age 7
  // Subtraction, first number > 10 (positive result)
  // Examples: 12-3, 14-5, 13-8, 18-9, 19-9,
  function () {
    const minuend = randInt(11, 40);
    const subtrahend = randInt(1, Math.min(10, minuend - 1));
    return {
      question: `${minuend} - ${subtrahend}`,
      answer: minuend - subtrahend,
    };
  },

  // Age 8
  // Addition, two-digit + two-digit, result < 100
  // Examples: 12+32, 78+12, 89+5 (89+5 uses one-digit in example; we keep both two-digit per rule)
  function () {
    const left = randInt(10, 89); // ensures room for right >=10 and sum < 100
    const right = randInt(10, 99 - left);
    return { question: `${left} + ${right}`, answer: left + right };
  },

  // Age 8
  // Subtraction, two-digit − two-digit, result >= 0
  // Examples: 32-13, 89-46, 50-50
  function () {
    const a = randInt(10, 99);
    const b = randInt(10, a); // ensure result >= 0
    return { question: `${a} - ${b}`, answer: a - b };
  },

  // Age 8
  // Multiplication, both numbers <= 5, avoid multiplying by 1
  // Examples: 2*2, 2*5, 5*5
  function () {
    const a = randInt(2, 5);
    const b = randInt(2, 5);
    return { question: `${a} × ${b}`, answer: a * b };
  },

  // Age 8
  // Division, first number < 30, second is single digit (2..9), integer result < 10
  // Examples: 6:3, 8:4, 20:5, 25:5, 14:2
  function () {
    const divisor = randInt(2, 9);
    const maxQuot = Math.min(9, Math.floor(29 / divisor)); // ensure quotient < 10
    const quotient = randInt(1, Math.max(1, maxQuot));
    const dividend = divisor * quotient; // guaranteed < 30
    return { question: `${dividend} : ${divisor}`, answer: quotient };
  },

  // Age 9
  // Multiplication, both numbers in 5..9
  // Examples: 5*6, 6*9, 9*5
  function () {
    const a = randInt(5, 9);
    const b = randInt(5, 9);
    return { question: `${a} × ${b}`, answer: a * b };
  },

  // Age 9
  // Any multiplication or division for numbers 2..9
  // For division, ensure integer result.
  function () {
    const isMultiplication = Math.random() < 0.5;
    if (isMultiplication) {
      const a = randInt(2, 9); // avoid multiplying by 1
      const b = randInt(2, 9); // avoid multiplying by 1
      return { question: `${a} × ${b}`, answer: a * b };
    } else {
      const divisor = randInt(2, 9); // avoid division by 1
      const quotient = randInt(2, 9); // avoid quotient of 1
      const dividend = divisor * quotient;
      return {
        question: `${dividend} : ${divisor}`,
        answer: quotient,
      };
    }
  },
];

function getLevelCount() {
  return levelGenerators.length;
}

function generateProblem(level) {
  const levelIndex = level - 1;

  if (levelIndex >= 0 && levelIndex < levelGenerators.length) {
    return levelGenerators[levelIndex]();
  } else {
    return { question: `No level found ${levelIndex}`, answer: 0 };
  }
}
