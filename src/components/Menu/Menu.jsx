import React from "react";
import { Link } from "react-router-dom";
import "./Menu.css";

const Menu = ({ onClose }) => (
    <nav className="vertical-menu">
        <div className="vertical-menu-title">メニュー</div>
        <ul className="vertical-menu-list">
        <li><Link to="/" onClick={onClose}>電卓</Link></li>
        <li><Link to="/Exchangerate" onClick={onClose}>為替レート</Link></li>
        </ul>
    </nav>
);

export default Menu;