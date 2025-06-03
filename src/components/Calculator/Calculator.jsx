import React, { useState, useEffect, useRef } from "react";
import './Calculator.css';
import { evaluate } from "mathjs";
import { gsap } from "gsap";
import AppMenuButton from '../AppMenuButton/AppMenuButton';

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

// パーセントを正しく変換
function convertPercent(str) {
    // 括弧式に%がつく場合 (3÷100)% など
    str = str.replace(/\)(%)/g, ')*0.01');
    // 掛け算・割り算の右辺が%の場合→ 100×5%→100*(5/100)
    str = str.replace(/(\d+(?:\.\d+)?)\s*([\*\/])\s*(\d+(?:\.\d+)?)(%)/g,
        (match, a, op, b) => `${a}${op}(${b}/100)`
    );
    // 足し算・引き算の右辺が%の場合→ 100+5%→100+(100*5/100)
    str = str.replace(/(\d+(?:\.\d+)?)\s*([\+\-])\s*(\d+(?:\.\d+)?)(%)/g,
        (match, a, op, b) => `${a}${op}(${a}*${b}/100)`
    );
    // 末尾の数値% → (n*0.01)
    str = str.replace(/(\d+(?:\.\d+)?)(%)/g, (match, n) => `(${n}*0.01)`);
    return str;
}

const isOperator = (v) => ["+", "-", "*", "/"].includes(v);

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
                duration: 0.5,
                ease: "power4.out",
                onStart: () => { historyContainer.style.visibility = 'visible'; }
            });
        } else {
            gsap.to(historyContainer, {
                y: "100%",
                opacity: 0,
                scale: 0.98,
                duration: 0.5,
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

    // 括弧補完
    const balanceParentheses = (expression) => {
        const openCount = (expression.match(/\(/g) || []).length;
        const closeCount = (expression.match(/\)/g) || []).length;
        return openCount > closeCount ? expression + ")".repeat(openCount - closeCount) : expression;
    };

    const handleButtonClick = (value) => {
        let rawInput = input.replace(/,/g, "");

        // 対応する(がなければ)は押せない
        if (value === ")") {
            const openCount = (rawInput.match(/\(/g) || []).length;
            const closeCount = (rawInput.match(/\)/g) || []).length;
            if (openCount <= closeCount) return;
            setInput(rawInput + value);
            return;
        }

        // 数字の最大桁数
        if (typeof value === "number") {
            const match = rawInput.match(/(\d+(\.\d*)?)$/);
            if (match) {
                const numPart = match[1].replace(".", "");
                if (numPart.length >= MAX_DIGIT) {
                    return;
                }
            }
        }

        // 演算子連打禁止（先頭のマイナスのみ許可）
        if (isOperator(value)) {
            if (!rawInput) {
                if (value === "-") setInput("-");
                return;
            }
            // 直前が演算子なら上書き（複数連続演算子禁止）
            if (isOperator(rawInput.slice(-1))) {
                setInput(rawInput.slice(0, -1) + value);
                return;
            }
            setInput(rawInput + value);
            return;
        }

        if (value === "%") {
            if (rawInput === "" || /[+\-*/.]$/.test(rawInput)) {
                setResult("エラー");
                return;
            }
            // 末尾が ) なら許可
            if (rawInput.endsWith(")")) {
                setInput(rawInput + "%");
                return;
            }
            // 末尾が数字なら許可
            if (/\d$/.test(rawInput)) {
                setInput(rawInput + "%");
                return;
            }
            setResult("エラー");
            return;
        }
        const currentNumberMatch = rawInput.match(/(\d+(\.\d*)?)$/);
        const currentNumberHasDecimal = currentNumberMatch && currentNumberMatch[0].includes('.');
        if (value === "." && currentNumberHasDecimal) {
            return;
        }
        if (value === "(") {
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
        setInput(rawInput + value);
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
        let currentInputForHistory = input.replace(/,/g, "");
        let balancedInput = balanceParentheses(currentInputForHistory);
        let expression = convertPercent(balancedInput); // パーセントを正しく変換
        setPreviousExpression(formatNumberInExpression(balancedInput));
        if (!expression || /[+\-*/%]$/.test(expression)) {
            setResult("エラー");
            return;
        }
        try {
            let expressionForEval = expression;
            if (/^[+\-*/]/.test(expression)) {
                const prevResultNum = parseFloat(String(result).replace(/,/g, ''));
                if (result !== "エラー" && !isNaN(prevResultNum)) {
                    expressionForEval = prevResultNum + expression;
                } else {
                    expressionForEval = "0" + expression;
                }
            }
            let newResult = evaluate(expressionForEval);
            let formattedResult = formatResult(newResult);

            setResult(formattedResult);
            setInput(formattedResult);
            // 修正: 履歴に追加する式も「括弧補完済み」を使う
            setHistory((prev) => [
                ...prev,
                `${formatNumberInExpression(balancedInput)} = ${formattedResult}`
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
            <AppMenuButton />
            <div className="display" ref={displayRef}>
                {previousExpression && (
                    <div className="previous-expression">
                        {toDisplaySymbols(formatNumberInExpression(previousExpression))}
                    </div>
                )}
                <div className="input-row">
                    <input
                        type="text"
                        value={toDisplaySymbols(formatNumberInExpression(input))}
                        readOnly
                        ref={displayInputRef}
                    />
                    {/* 括弧補完ヒント */}
                    {(() => {
                        const rawInput = input.replace(/,/g, "");
                        const openCount = (rawInput.match(/\(/g) || []).length;
                        const closeCount = (rawInput.match(/\)/g) || []).length;
                        if (openCount > closeCount) {
                            return (
                                <span className="paren-hint">
                                    {")".repeat(openCount - closeCount)}
                                </span>
                            );
                        }
                        return null;
                    })()}
                </div>
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
                <button className="history-btn" onClick={() => setHistoryOpen(!historyOpen)}>履歴</button>
                <button className="equal-btn" onClick={handleCalculate}>=</button>
            </div>
            <div className="history-container" ref={historyContainerRef}>
                <div className="history-header">
                    <div className="history-header-title">
                        計算履歴
                        <span className="history-header-sub">(式・結果を再利用可能)</span>
                    </div>
                    <div className="history-header-buttons">
                        <button className="clear-history-btn-small" onClick={handleClearHistory}>クリア</button>
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
                                    <button className="reuse-btn" onClick={() => handleReuseResult(entry)}>結果</button>
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