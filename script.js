// =============================================
// SMART CALCULATOR PRO (Fixed Version)
// =============================================

// ===========================
// DOM ELEMENTS
// ===========================
const mainDisplay = document.getElementById("mainDisplay");
const historyDisplay = document.getElementById("historyDisplay");
const buttons = document.querySelectorAll(".btn");
const scientificPanel = document.getElementById("scientificPanel");
const scientificBtn = document.getElementById("scientificBtn");
const historyBtn = document.getElementById("historyBtn");
const historyPanel = document.getElementById("historyPanel");
const themeBtn = document.getElementById("themeBtn");
const copyBtn = document.getElementById("copyBtn");
const clickSound = document.getElementById("clickSound");

// ===========================
// Calculator State
// ===========================
let expression = "";
let result = "0";
let darkMode = true;
let memoryValue = 0;
let lastAnswer = "0";

// ===========================
// Update Display
// ===========================
function updateDisplay() {
    historyDisplay.textContent = expression || "0";
    mainDisplay.textContent = result;
}

// ===========================
// Reset Calculator
// ===========================
function resetCalculator() {
    expression = "";
    result = "0";
    updateDisplay();
}

// ===========================
// Delete Last Character
// ===========================
function deleteLast() {
    expression = expression.slice(0, -1);
    updateDisplay();
}

// ===========================
// Toggle Sign
// ===========================
function toggleSign() {
    if (!expression.trim()) {
        expression = "-";
        updateDisplay();
        return;
    }

    if (expression.startsWith("-")) {
        expression = expression.slice(1);
    } else {
        expression = `-${expression}`;
    }

    updateDisplay();
}

// ===========================
// Apply Percentage
// ===========================
function applyPercentage() {
    if (!expression.trim()) {
        result = "0";
        updateDisplay();
        return;
    }

    const match = expression.match(/(\d*\.?\d+)$/);
    if (!match) {
        return;
    }

    const value = Number(match[1]);
    const newValue = value / 100;
    expression = expression.slice(0, -match[1].length) + String(newValue);
    updateDisplay();
}

// ===========================
// Memory Operations
// ===========================
function memoryAction(action) {
    const currentNumber = Number(result !== "Error" ? result : expression || 0);

    switch (action) {
        case "MC":
            memoryValue = 0;
            showToast("Memory Cleared");
            break;
        case "MR":
            expression = String(memoryValue);
            result = expression;
            updateDisplay();
            showToast("Memory Recalled");
            return;
        case "M+":
            memoryValue += currentNumber;
            showToast("Stored in Memory");
            break;
        case "M-":
            memoryValue -= currentNumber;
            showToast("Subtracted from Memory");
            break;
        default:
            break;
    }

    updateDisplay();
}

// ===========================
// Play Button Sound
// ===========================
function playSound() {
    if (!clickSound) return;
    clickSound.pause();
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
}

// ===========================
// Append Value
// ===========================
function appendValue(value) {
    playSound();
    expression += value;
    updateDisplay();
}

// ===========================
// Button Click Events
// ===========================
buttons.forEach(button => {
    button.addEventListener("click", () => {
        const value = button.dataset.value;
        switch (value) {
            case "AC":
                resetCalculator();
                break;
            case "DEL":
                deleteLast();
                break;
            case "=":
                calculate();
                break;
            case "%":
                applyPercentage();
                break;
            case "±":
                toggleSign();
                break;
            case "MC":
            case "MR":
            case "M+":
            case "M-":
                memoryAction(value);
                break;
            default:
                appendValue(value);
        }
    });
});

// ===========================
// Toggle Panels
// ===========================
scientificBtn.addEventListener("click", () => {
    scientificPanel.classList.toggle("show");
});
historyBtn.addEventListener("click", () => {
    historyPanel.classList.toggle("show");
});

// ===========================
// Initial Display
// ===========================
updateDisplay();

// =============================================
// Calculation Engine
// =============================================
function prepareExpression(exp) {
    return exp
        .replace(/Math\.PI/g, Math.PI)
        .replace(/Math\.E/g, Math.E)
        .replace(/sqrt\(/g, "Math.sqrt(")
        .replace(/sin\(/g, "Math.sin(")
        .replace(/cos\(/g, "Math.cos(")
        .replace(/tan\(/g, "Math.tan(")
        .replace(/log\(/g, "Math.log10(")
        .replace(/ln\(/g, "Math.log(");
}

function calculate() {
    if (!expression.trim()) {
        result = "Error";
        updateDisplay();
        return;
    }

    try {
        let exp = prepareExpression(expression);
        let answer = Function(`"use strict"; return (${exp})`)();

        if (typeof answer !== "number" || !isFinite(answer)) {
            throw Error("Invalid calculation");
        }

        result = Number(answer.toFixed(8)).toString();
        lastAnswer = result;
        updateDisplay();
        saveHistory(expression, result);
        expression = result;
    } catch {
        result = "Error";
        lastAnswer = result;
        updateDisplay();
        saveHistory(expression || "Invalid", result);
    }
}

// ===========================
// Percentage
// ===========================
function percentage() {
    try {
        expression = (parseFloat(expression) / 100).toString();
        result = expression;
        updateDisplay();
    } catch {
        result = "Error";
        updateDisplay();
    }
}

// ===========================
// Keyboard Support
// ===========================
document.addEventListener("keydown", (e) => {
    const key = e.key;
    if ("0123456789".includes(key)) appendValue(key);
    else if (key === ".") appendValue(".");
    else if (key === "+") appendValue("+");
    else if (key === "-") appendValue("-");
    else if (key === "*") appendValue("*");
    else if (key === "/") { e.preventDefault(); appendValue("/"); }
    else if (key === "%") { e.preventDefault(); applyPercentage(); }
    else if (key === "Backspace") deleteLast();
    else if (key === "Escape") resetCalculator();
    else if (key === "Enter") { e.preventDefault(); calculate(); }
    else if (key === "n" || key === "N") { toggleSign(); }
    else if (key === "m") {
        memoryAction("M+");
    }
    else if (key === "M") {
        memoryAction("M-");
    }
});

// ===========================
// Display Animation
// ===========================
function animateDisplay() {
    mainDisplay.classList.add("update");
    setTimeout(() => {
        mainDisplay.classList.remove("update");
    }, 250);
}
const oldUpdate = updateDisplay;
updateDisplay = function () {
    oldUpdate();
    animateDisplay();
};

// =============================================
// History, Theme, Copy & Local Storage
// =============================================
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");
const downloadHistoryBtn = document.getElementById("downloadHistory");

let history = JSON.parse(localStorage.getItem("calcHistory")) || [];

function saveHistory(expression, answer) {
    const time = new Date().toLocaleTimeString();
    history.unshift({ expression, answer, time });
    if (history.length > 25) history.pop();
    localStorage.setItem("calcHistory", JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = "";
    if (history.length === 0) {
        historyList.innerHTML = `<li class="empty-history">No calculations yet</li>`;
        return;
    }
    history.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${item.expression}</strong><br>= ${item.answer}<br><small>${item.time}</small>`;
        historyList.appendChild(li);
    });
}

clearHistoryBtn.addEventListener("click", () => {
    if (!confirm("Clear all history?")) return;
    history = [];
    localStorage.removeItem("calcHistory");
    renderHistory();
    showToast("History Cleared");
});

themeBtn.addEventListener("click", () => {
    darkMode = !darkMode;
    document.body.classList.toggle("light");
    const icon = themeBtn.querySelector("i");
    icon.className = darkMode ? "fa-solid fa-moon" : "fa-solid fa-sun";
    localStorage.setItem("theme", darkMode ? "dark" : "light");
});

copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(result);
    showToast("Result Copied");
});

function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}

downloadHistoryBtn.addEventListener("click", () => {
    if (history.length === 0) {
        showToast("No History Found");
        return;
    }
    let text = "SMART CALCULATOR HISTORY\n\n";
    history.forEach(item => {
        text += `${item.expression} = ${item.answer} (${item.time})\n`;
    });
    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Calculator-History.txt";
    link.click();
    showToast("History Exported");
});

renderHistory();

// =============================================
// Final Polish
// =============================================
document.querySelectorAll(".btn").forEach(button => {
    button.addEventListener("click", function (e) {
        const ripple = document.createElement("span");
        ripple.classList.add("ripple");
        const size = Math.max(this.clientWidth, this.clientHeight);
        ripple.style.width = size + "px";
        ripple.style.height = size + "px";
        ripple.style.left = e.offsetX - size / 2 + "px";
        ripple.style.top = e.offsetY - size / 2 + "px";
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
});

window.addEventListener("load", () => {
    document.body.classList.add("fade-up");
    showToast("Welcome to Smart Calculator Pro");
});

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "c") {
        navigator.clipboard.writeText(result);
        showToast("Result Copied");
    }
    if (e.ctrlKey && e.key === "l") {
        e.preventDefault();
        resetCalculator();
    }
});

historyList.addEventListener("click", (e) => {
    const item = e.target.closest("li");
    if (!item) return;
    const text = item.innerText.split("=")[0].trim();
    expression = text;
    updateDisplay();
});

