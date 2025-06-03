import React, { useState, useEffect } from 'react';
import './Exchangerate.css';
import AppMenuButton from '../AppMenuButton/AppMenuButton';

const BUTTONS = [
    { label: "7", value: 7 }, { label: "8", value: 8 }, { label: "9", value: 9 },
    { label: "4", value: 4 }, { label: "5", value: 5 }, { label: "6", value: 6 },
    { label: "1", value: 1 }, { label: "2", value: 2 }, { label: "3", value: 3 },
    { label: ".", value: "." }, { label: "0", value: 0 }
];
const MAX_FONT_SIZE = 26;
const MIN_FONT_SIZE = 10;
const MAX_PLACEHOLDER_FONT_SIZE = 22;

const AutoFontInput = React.forwardRef(
    ({ value, placeholder, className, ...props }, ref) => {
        const innerRef = React.useRef(null);
        const inputRef = ref ?? innerRef;
        const spanRef = React.useRef(null);
        const [fontSize, setFontSize] = useState(MAX_FONT_SIZE);

        useEffect(() => {
            if (!inputRef.current || !spanRef.current) return;
            spanRef.current.textContent = value !== "" ? value : (placeholder || "");
            let size = value !== "" ? MAX_FONT_SIZE : MAX_PLACEHOLDER_FONT_SIZE;
            spanRef.current.style.fontSize = `${size}px`;
            const inputWidth = inputRef.current.clientWidth;
            while (spanRef.current.scrollWidth > inputWidth && size > MIN_FONT_SIZE) {
                size -= 0.5;
                spanRef.current.style.fontSize = `${size}px`;
            }
            setFontSize(size);
        }, [value, placeholder, inputRef]);

        return (
            <>
                <input
                    ref={inputRef}
                    value={value}
                    placeholder={placeholder}
                    style={{ fontSize: `${fontSize}px` }}
                    className={className}
                    {...props}
                />
                <span
                    ref={spanRef}
                    style={{
                        position: "absolute",
                        visibility: "hidden",
                        whiteSpace: "pre",
                        fontFamily: "inherit",
                        fontWeight: "inherit",
                        padding: 0,
                        margin: 0,
                        left: "-9999px"
                    }}
                    aria-hidden="true"
                />
            </>
        );
    }
);
const CURRENCIES = [
    { code: 'JPY', name: '日本', unit: '円' },
    { code: 'USD', name: 'アメリカ', unit: 'ドル' },
    { code: 'EUR', name: 'ユーロ', unit: 'ユーロ' },
    { code: 'KRW', name: '韓国', unit: 'ウォン' },
    { code: 'INR', name: 'インド', unit: 'ルピー' },
    { code: 'EUR', name: 'ドイツ', unit: 'ユーロ' },
    { code: 'AUD', name: 'オーストラリア', unit: 'ドル' },
    { code: 'EUR', name: 'フランス', unit: 'ユーロ' },
    { code: 'CHF', name: 'スイス', unit: 'フラン' },
    { code: 'ZAR', name: '南アフリカ', unit: 'ランド' },
    { code: 'CAD', name: 'カナダ', unit: 'ドル' },
    { code: 'GBP', name: 'イギリス', unit: 'ポンド' },
    { code: 'PHP', name: 'フィリピン', unit: 'ペソ' },
    { code: 'BRL', name: 'ブラジル', unit: 'レアル' },
    { code: 'ARS', name: 'アルゼンチン', unit: 'ペソ' },
];

const Exchangerate = () => {
    const [fromCurrency, setFromCurrency] = useState('JPY');
    const [toCurrency, setToCurrency] = useState('USD');
    const [showFromList, setShowFromList] = useState(false);
    const [showToList, setShowToList] = useState(false);
    const [rate, setRate] = useState(null);
    const [yen, setYen] = useState('');
    const [searchFrom, setSearchFrom] = useState('');
    const [searchTo, setSearchTo] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (fromCurrency && toCurrency) {
            fetch(`https://api.exchangerate.host/latest?base=${fromCurrency}&symbols=${toCurrency}`)
                .then(res => res.json())
                .then(data => {
                    setRate(data.rates[toCurrency]);
                    setError('');
                })
                .catch(() => setError('為替レートの取得に失敗しました'));
        }
    }, [fromCurrency, toCurrency]);

    const targetValue = yen && rate
        ? (parseFloat(yen) * rate).toLocaleString(undefined, { maximumFractionDigits: 2 })
        : '';

   const MAX_DIGITS = 18; // 999999999999999999（18桁）

    const handleButtonClick = (value) => {
        if (value === 'C') {
            setYen(yen.slice(0, -1));
        } else if (value === '.' && yen.includes('.')) {
            return;
        } else {
            // 小数点を除いた数字の桁数で判定
            const next = (yen === '0' && value !== '.') ? String(value) : yen + value;
            const digitCount = next.replace(/\D/g, '').length; // 数字の桁数だけ数える
            if (digitCount > MAX_DIGITS) return;
            setYen(next);
        }
    };

    // バックスペース機能
    const handleDeleteLast = () => {
        setYen((prev) => prev.slice(0, -1));
    };

    const fromCurrencyObj = CURRENCIES.find(cur => cur.code === fromCurrency);
    const toCurrencyObj = CURRENCIES.find(cur => cur.code === toCurrency);

    const fromPlaceholder = fromCurrencyObj
        ? `${fromCurrencyObj.unit}を入力してください`
        : `${fromCurrency}を入力してください`;

    const toPlaceholder = toCurrencyObj
        ? `${toCurrencyObj.name}（${toCurrencyObj.unit}）`
        : toCurrency;

    // 検索フィルタ（国名・単位・コードでフィルタ可能）
    const filteredFromList = CURRENCIES.filter(cur =>
        cur.code.toLowerCase().includes(searchFrom.toLowerCase()) ||
        cur.name.includes(searchFrom) ||
        cur.unit.includes(searchFrom)
    );
    const filteredToList = CURRENCIES.filter(cur =>
        cur.code.toLowerCase().includes(searchTo.toLowerCase()) ||
        cur.name.includes(searchTo) ||
        cur.unit.includes(searchTo)
    );

    return (
        <div className="Exchangerate">
            <AppMenuButton />
            <div className="display-area">
                <div className="top-bar">
                    {/* 通貨選択（from） */}
                    <div
                        className="color-box pink"
                        onClick={() => setShowFromList(true)}
                        tabIndex={0}
                        role="button"
                    >
                        <div className="currency-label">
                            <span>{fromCurrencyObj?.name || fromCurrency}</span>
                            <span className="currency-sub">
                                ({fromCurrencyObj?.unit || fromCurrency})
                            </span>
                        </div>
                    </div>
                    {/* 通貨選択（to） */}
                    <div className="bottom-row">
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-arrow-return-right" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M1.5 1.5A.5.5 0 0 0 1 2v4.8a2.5 2.5 0 0 0 2.5 2.5h9.793l-3.347 3.346a.5.5 0 0 0 .708.708l4.2-4.2a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 8.3H3.5A1.5 1.5 0 0 1 2 6.8V2a.5.5 0 0 0-.5-.5"/>
                        </svg>
                        <div
                            className="color-box blue"
                            onClick={() => setShowToList(true)}
                            tabIndex={0}
                            role="button"
                        >
                            <div className="currency-label">
                                <span>{toCurrencyObj?.name || toCurrency}</span>
                                <span className="currency-sub">
                                    ({toCurrencyObj?.unit || toCurrency})
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* エラー表示 */}
                {error && (
                    <div style={{ color: 'red', fontSize: '0.9em', margin: '0 0 8px 0', textAlign: 'center' }}>{error}</div>
                )}

                {/* 通貨選択リスト（from） */}
                {showFromList && (() => {
                    // 最初だけ青くするためのインデックス
                    const firstSelectedFromIdx = filteredFromList.findIndex(cur => cur.code === fromCurrency);
                    return (
                    <div className="currency-list-overlay" onClick={() => setShowFromList(false)}>
                        <div className="currency-list" onClick={e => e.stopPropagation()}>
                            <input
                                type="text"
                                className="currency-search"
                                placeholder="通貨検索"
                                value={searchFrom}
                                onChange={e => setSearchFrom(e.target.value)}
                                style={{ marginBottom: 6, width: '90%' }}
                            />
                            {filteredFromList.length === 0 && (
                                <div className="currency-list-empty">該当なし</div>
                            )}
                            {filteredFromList.map((cur, idx) => (
                                <div
                                    key={cur.code + '-' + idx}
                                    onClick={() => {
                                        setFromCurrency(cur.code);
                                        setShowFromList(false);
                                        setSearchFrom('');
                                    }}
                                    className={idx === firstSelectedFromIdx ? 'selected-currency' : ''}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {cur.name} ({cur.code}) {cur.unit}
                                </div>
                            ))}
                        </div>
                    </div>
                    );
                })()}

                {/* 通貨選択リスト（to） */}
                {showToList && (() => {
                    const firstSelectedToIdx = filteredToList.findIndex(cur => cur.code === toCurrency);
                    return (
                    <div className="currency-list-overlay" onClick={() => setShowToList(false)}>
                        <div className="currency-list" onClick={e => e.stopPropagation()}>
                            <input
                                type="text"
                                className="currency-search"
                                placeholder="通貨検索"
                                value={searchTo}
                                onChange={e => setSearchTo(e.target.value)}
                                style={{ marginBottom: 6, width: '90%' }}
                            />
                            {filteredToList.length === 0 && (
                                <div className="currency-list-empty">該当なし</div>
                            )}
                            {filteredToList.map((cur, idx) => (
                                <div
                                    key={cur.code + '-' + idx}
                                    onClick={() => {
                                        setToCurrency(cur.code);
                                        setShowToList(false);
                                        setSearchTo('');
                                    }}
                                    className={idx === firstSelectedToIdx ? 'selected-currency' : ''}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {cur.name} ({cur.code}) {cur.unit}
                                </div>
                            ))}
                        </div>
                    </div>
                    );
                })()}

                {/* 入力欄 */}
                <div className="color-box orange">
                    <AutoFontInput
                        value={yen}
                        placeholder={fromPlaceholder}
                        readOnly
                        className="currency-input"
                        inputMode="decimal"
                    />
                </div>

                {/* 出力欄 */}
                <div className="color-box purple">
                    <AutoFontInput
                        value={targetValue}
                        placeholder={toPlaceholder}
                        readOnly
                        className="currency-output"
                    />
                </div>
            </div>
            {/* 電卓ボタン */}
            <div className="Exchangerate-button">
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
                <button onClick={handleDeleteLast}>⌫</button>
            </div>
        </div>
    );
};

export default Exchangerate;