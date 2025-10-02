// Math Problem Generator - Levels Logic

function getLevelCount() {
    return 5;
}

function generateProblem(level) {
    let currentProblem = {};
    
    if (level === 1) {
        // Level 1: Simple addition (1-3) and subtraction with results 1-3
        const isAddition = Math.random() > 0.5;
        
        if (isAddition) {
            const num1 = Math.floor(Math.random() * 3) + 1;
            const num2 = Math.floor(Math.random() * 3) + 1;
            currentProblem = {
                question: `${num1} + ${num2}`,
                answer: num1 + num2
            };
        } else {
            // For subtraction, ensure result is between 1-3
            const result = Math.floor(Math.random() * 3) + 1;
            const addend = Math.floor(Math.random() * 3) + 1;
            const minuend = result + addend;
            currentProblem = {
                question: `${minuend} - ${addend}`,
                answer: result
            };
        }
    } else if (level === 2) {
        // Level 2: Addition and subtraction (1-15)
        const num1 = Math.floor(Math.random() * 15) + 1;
        const num2 = Math.floor(Math.random() * 15) + 1;
        const isAddition = Math.random() > 0.5;
        
        if (isAddition) {
            currentProblem = {
                question: `${num1} + ${num2}`,
                answer: num1 + num2
            };
        } else {
            const larger = Math.max(num1, num2);
            const smaller = Math.min(num1, num2);
            currentProblem = {
                question: `${larger} - ${smaller}`,
                answer: larger - smaller
            };
        }
    } else if (level === 3) {
        // Level 3: Multiplication only (2-5)
        const num1 = Math.floor(Math.random() * 4) + 2;
        const num2 = Math.floor(Math.random() * 4) + 2;
        currentProblem = {
            question: `${num1} × ${num2}`,
            answer: num1 * num2
        };
    } else if (level === 4) {
        // Level 4: Addition and subtraction with two-digit numbers (10-99)
        const num1 = Math.floor(Math.random() * 90) + 10;
        const num2 = Math.floor(Math.random() * 90) + 10;
        const isAddition = Math.random() > 0.5;
        
        if (isAddition) {
            currentProblem = {
                question: `${num1} + ${num2}`,
                answer: num1 + num2
            };
        } else {
            const larger = Math.max(num1, num2);
            const smaller = Math.min(num1, num2);
            currentProblem = {
                question: `${larger} - ${smaller}`,
                answer: larger - smaller
            };
        }
    } else if (level === 5) {
        // Level 5: Multiplication and division (2-9)
        const num1 = Math.floor(Math.random() * 8) + 2;
        const num2 = Math.floor(Math.random() * 8) + 2;
        const isMultiplication = Math.random() > 0.5;
        
        if (isMultiplication) {
            currentProblem = {
                question: `${num1} × ${num2}`,
                answer: num1 * num2
            };
        } else {
            // For division, ensure result is a whole number between 2-9
            const result = Math.floor(Math.random() * 8) + 2;
            const divisor = Math.floor(Math.random() * 8) + 2;
            const dividend = result * divisor;
            currentProblem = {
                question: `${dividend} : ${divisor}`,
                answer: result
            };
        }
    }
    
    return currentProblem;
}
