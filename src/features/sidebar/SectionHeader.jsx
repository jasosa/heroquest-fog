import { T, FONT_HEADING } from "../../shared/theme.js";

const ruleStyle = {
  flex: 1,
  height: 1,
  background: `linear-gradient(to right, transparent, ${T.sidebarDivider})`,
};

const ruleStyleReversed = {
  flex: 1,
  height: 1,
  background: `linear-gradient(to left, transparent, ${T.sidebarDivider})`,
};

export function SectionHeader({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0" }}>
      <div style={ruleStyle} />
      <span style={{
        fontFamily: FONT_HEADING, textTransform: "uppercase",
        letterSpacing: 3, fontSize: 11, color: T.sidebarTitle,
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
      <div style={ruleStyleReversed} />
    </div>
  );
}
