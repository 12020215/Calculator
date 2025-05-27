import React, { useState, useEffect, useRef } from "react";
import "./Calculator.css";
import { evaluate } from "mathjs";
import { gsap } from "gsap";

const MOBILE_MARGIN = 32;
const MAX_DIGIT = 15;

const BUTTONS = [
    { label: "(", value: "(" }, { label: ")", value: ")" },
    { label: "7", value: 7 }, { label: "8", value: 8 }, { label: "9", value: 9 }, { label: "+", value: "+" },
    { label: "4", value: 4 }, { label: "5", value: 5 }, { label: "6", value: 6 }, { label: "-", value: "-" },
    { label: "1", value: 1 }, { label: "2", value: 2 }, { label: "3", value: 3 }, { label: "×", value: "*" },
    { label: ".", value: "." }, { label: "0", value: 0 }, { label: "%", value: "%" }, { label: "÷", value: "/" }
];

const toDisplaySymbols = (str) =>
    str.replace(/\*/g, "×").replace(/\//g, "÷");

const formatNumberInExpression = (expr) => {
    if (!expr) return "";
    return expr.replace(/\d+(\.\d+)?/g, (match) => {
        if (match.startsWith("0") && match.length > 1 && !match.startsWith("0.")) {
            return match;
        }
        if (match.includes(".")) {
            const [int, dec] = match.split(".");
            return Number(int).toLocaleString() + "." + dec;
        }
        return Number(match).toLocaleString();
    });
};

const ellipsisExpression = (expr, max = 22) => {
    if (!expr) return "";
    if (expr.length <= max) return expr;
    return expr.slice(0, 8) + "..." + expr.slice(-8);
};

const formatResult = (num) => {
    if (typeof num === "string" && num === "エラー") return num;
    if (typeof num === "number") {
        if (Math.abs(num) >= 1e12 || String(num).includes("e")) {
            return num.toExponential().replace("+", "");
        }
        return num.toLocaleString("en-US");
    }
    if (String(num).match(/e[\+\-]?\d+$/i)) return String(num);
    return String(num);
};

const Calculator = () => {
    const [input, setInput] = useState("");
    const [result, setResult] = useState(0);
    const [history, setHistory] = useState([]);
    const [previousExpression, setPreviousExpression] = useState("");
    const [historyOpen, setHistoryOpen] = useState(false);

    const historyContainerRef = useRef(null);
    const displayRef = useRef(null);
    const displayInputRef = useRef(null);

    useEffect(() => {
        const savedHistory = JSON.parse(localStorage.getItem("calcHistory")) || [];
        setHistory(savedHistory);
    }, []);

    useEffect(() => {
        localStorage.setItem("calcHistory", JSON.stringify(history));
    }, [history]);

    // 下から上に履歴パネルが出るように
    useEffect(() => {
        if (!historyContainerRef.current) return;
        const historyContainer = historyContainerRef.current;
        historyContainer.style.position = "absolute";
        historyContainer.style.left = "50%";
        historyContainer.style.bottom = "0";
        historyContainer.style.transform = "translateX(-50%)";
        historyContainer.style.width = "100%";
        historyContainer.style.maxWidth = window.innerWidth <= 600 ? "95vw" : "320px";
        historyContainer.style.margin = "0";
        historyContainer.style.height = `${window.innerHeight / 2}px`;

        if (historyOpen) {
            gsap.to(historyContainer, {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.3,
                ease: "power4.out",
                onStart: () => { historyContainer.style.visibility = 'visible'; }
            });
            } else {
                gsap.to(historyContainer, {
                    y: "100%",
                    opacity: 0,
                    scale: 0.98,
                    duration: 0.3,
                    ease: "power4.in",
                    onComplete: () => { historyContainer.style.visibility = 'hidden'; }
                });
        }
    }, [historyOpen]);

    useEffect(() => {
        if (displayInputRef.current) {
            displayInputRef.current.scrollLeft = displayInputRef.current.scrollWidth;
        }
    }, [input]);

    const balanceParentheses = (expression) => {
        const openCount = (expression.match(/\(/g) || []).length;
        const closeCount = (expression.match(/\)/g) || []).length;
        return openCount > closeCount ? expression + ")".repeat(openCount - closeCount) : expression;
    };

    const handleButtonClick = (value) => {
        let rawInput = input.replace(/,/g, "");

        if (typeof value === "number") {
            const match = rawInput.match(/(\d+(\.\d*)?)$/);
            if (match) {
                const numPart = match[1].replace(".", "");
                if (numPart.length >= MAX_DIGIT) {
                    return;
                }
            }
        }

        if (value === "-") {
            if (!rawInput) {
                setInput("-");
                return;
            }
            if (/[+\-*/.]$/.test(rawInput) && !rawInput.endsWith(".")) {
                setInput(rawInput + value);
                return;
            }
            if (rawInput.endsWith("(") || rawInput.endsWith(" ")) {
                setInput(rawInput + value);
                return;
            }
        }
        if (value === "%") {
            if (rawInput === "" || /[+\-*/.]$/.test(rawInput)) {
                setResult("エラー");
                return;
            }
            const lastNumberMatch = rawInput.match(/(\d+(\.\d*)?)$/);
            if (!lastNumberMatch) {
                setResult("エラー");
                return;
            }
            const lastNumberStr = lastNumberMatch[0];
            const percentValue = parseFloat(lastNumberStr);
            const expressionBeforeLastNumber = rawInput.substring(0, lastNumberMatch.index);
            let convertedExpression = "";
            let baseCalculatedValue = 0;
            const lastBaseValueMatch = expressionBeforeLastNumber.match(/(\d+(\.\d*)?)\s*([+\-*/])\s*$/);
            if (lastBaseValueMatch) {
                const baseNumberStr = lastBaseValueMatch[1];
                const operator = lastBaseValueMatch[3];
                const partBeforeOperator = expressionBeforeLastNumber.substring(0, lastBaseValueMatch.index);
                try {
                    baseCalculatedValue = evaluate(baseNumberStr);
                } catch (e) {
                    setResult("エラー");
                    return;
                }
                convertedExpression = `${partBeforeOperator}${baseNumberStr}${operator}(${baseCalculatedValue} * ${percentValue / 100})`;
            } else if (rawInput === lastNumberStr) {
                convertedExpression = `(${percentValue} / 100)`;
            } else {
                try {
                    baseCalculatedValue = evaluate(expressionBeforeLastNumber === "" ? "0" : expressionBeforeLastNumber);
                } catch (e) {
                    setResult("エラー");
                    return;
                }
                convertedExpression = `${expressionBeforeLastNumber}(${baseCalculatedValue} * ${percentValue / 100})`;
            }
            setInput(convertedExpression);
            return;
        }
        const currentNumberMatch = rawInput.match(/(\d+(\.\d*)?)$/);
        const currentNumberHasDecimal = currentNumberMatch && currentNumberMatch[0].includes('.');
        if (value === "." && currentNumberHasDecimal) {
            return;
        }
        if (value === "(" || value === ")") {
            setInput(rawInput + value);
            return;
        }
        if (rawInput === "0" && value === ".") {
            setInput("0.");
            return;
        }
        if (!rawInput && /[+\*/]/.test(value)) {
            setInput("0" + value);
            return;
        }
        if (/[+\-*/]$/.test(rawInput) && /[+\-*/]/.test(value)) {
            setInput(rawInput.slice(0, -1) + value);
        } else {
            setInput(rawInput + value);
        }
    };

    const handleClearAll = () => {
        setInput("");
        setResult(0);
        setPreviousExpression("");
    };
    const handleDeleteLast = () => {
        let rawInput = input.replace(/,/g, "");
        setInput(rawInput.slice(0, -1));
    };
    const handleCalculate = () => {
        const currentInputForHistory = input.replace(/,/g, "");
        setPreviousExpression(formatNumberInExpression(currentInputForHistory));
        let expression = balanceParentheses(currentInputForHistory);
        if (!expression || /[+\-*/%]$/.test(expression)) {
            setResult("エラー");
            return;
        }
        try {
            if (/^[+\-*/]/.test(expression)) {
                const prevResultNum = parseFloat(String(result).replace(/,/g, ''));
                if (result !== "エラー" && !isNaN(prevResultNum)) {
                    expression = prevResultNum + expression;
                } else {
                    expression = "0" + expression;
                }
            }
            let newResult = evaluate(expression);
            let formattedResult = formatResult(newResult);

            setResult(formattedResult);
            setInput(formattedResult);
            setHistory((prev) => [
                ...prev,
                `${formatNumberInExpression(currentInputForHistory)} = ${formattedResult}`
            ]);
        } catch (e) {
            setResult("エラー");
            setInput("");
        }
    };
    const handleReuseEquation = (entry) => {
        const equation = entry.split(" = ")[0].replace(/,/g, "");
        setInput(equation);
        setPreviousExpression("");
    };
    const handleReuseResult = (entry) => {
        const resultValue = entry.split(" = ")[1].replace(/,/g, "");
        setInput(resultValue);
        setPreviousExpression("");
    };
    const handleDeleteHistory = (index) => {
        const updatedHistory = history.filter((_, i) => i !== index);
        setHistory(updatedHistory);
    };
    const handleClearHistory = () => {
        setHistory([]);
        localStorage.removeItem("calcHistory");
    };

    return (
        <div className="calculator">
            <div className="display" ref={displayRef}>
                {previousExpression && (
                    <div className="previous-expression">
                        {toDisplaySymbols(formatNumberInExpression(previousExpression))}
                    </div>
                )}
                <input
                    type="text"
                    value={toDisplaySymbols(formatNumberInExpression(input))}
                    readOnly
                    ref={displayInputRef}
                />
            </div>
            <div className="buttons">
                <button onClick={handleClearAll}>AC</button>
                <button onClick={handleDeleteLast}>⌫</button>
                {BUTTONS.map((btn, idx) => (
                    <button
                        key={btn.label + idx}
                        onClick={() => handleButtonClick(btn.value)}
                        className={
                            btn.label === "×" || btn.label === "+" || btn.label === "-" || btn.label === "÷"
                                ? "operator-btn"
                                : ""
                        }
                    >
                        {btn.label}
                    </button>
                ))}
                <button className="history-btn" onClick={() => setHistoryOpen(!historyOpen)}>R</button>
                <button className="equal-btn" onClick={handleCalculate}>=</button>
            </div>
            <div className="history-container" ref={historyContainerRef}>
                <div className="history-header">
                    <div className="history-header-title">
                        計算履歴
                        <span className="history-header-sub">(式・答えを再利用可能)</span>
                    </div>
                    <div className="history-header-buttons">
                        <button className="clear-history-btn-small" onClick={handleClearHistory}>AC</button>
                        <button className="close-history" onClick={() => setHistoryOpen(false)}>✖️</button>
                    </div>
                </div>
                <ul>
                    {history.map((entry, index) => {
                        const [expression, result] = entry.split(' = ');
                        return (
                            <li key={index}>
                                <span className="history-expression">
                                    {toDisplaySymbols(ellipsisExpression(formatNumberInExpression(expression), 22))}
                                </span>
                                <span className="history-result">
                                    {toDisplaySymbols(formatResult(result))}
                                </span>
                                <div className="history-item-buttons">
                                    <button className="delete-btn" onClick={() => handleDeleteHistory(index)}>削除</button>
                                    <button className="reuse-btn" onClick={() => handleReuseEquation(entry)}>式</button>
                                    <button className="reuse-btn" onClick={() => handleReuseResult(entry)}>Ans</button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default Calculator;