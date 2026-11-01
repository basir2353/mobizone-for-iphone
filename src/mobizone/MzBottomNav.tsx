import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/home", label: "Home", icon: "⌂" },
  { to: "/stock", label: "Stock", icon: "▣" },
  { to: "/scan", label: "Scan", icon: "⌖" },
  { to: "/sale", label: "Sell", icon: "🛒" },
  { to: "/more", label: "More", icon: "☰" },
] as const;

export function MzBottomNav() {
  return (
    <nav className="mz-bottom-nav" aria-label="Main">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `mz-tab ${isActive ? "is-active" : ""}`}
        >
          <span className="mz-tab-icon" aria-hidden>
            {tab.icon}
          </span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
