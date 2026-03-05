import type React from "react";

const C_GOLD = "#e8a020";
const C_B1 = "rgba(255,255,255,.09)";
const C_T2 = "#8a9bb8";

export function pillStyle(active: boolean): React.CSSProperties {
  return {
    padding: "5px 10px",
    background: active ? C_GOLD : "none",
    border: `1px solid ${active ? C_GOLD : C_B1}`,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: active ? 700 : 500,
    color: active ? "#070f1c" : C_T2,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    fontFamily: "Outfit,sans-serif",
  };
}
