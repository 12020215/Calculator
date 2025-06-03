import React, { useState } from "react";
import Menu from "../Menu/Menu";
import "./AppMenuButton.css";

const AppMenuButton = () => {
const [showMenu, setShowMenu] = useState(false);

    return (
        <>
        <button
            className="app-menu-button"
            onClick={() => setShowMenu(!showMenu)}
            aria-label={showMenu ? "メニューを閉じる" : "メニューを開く"}
        >
            {showMenu ? "×" : "≡"}
        </button>
        {showMenu && (
            <Menu onClose={() => setShowMenu(false)} />
        )}
        </>
    );
};

export default AppMenuButton;