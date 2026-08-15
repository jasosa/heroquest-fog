import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(__dirname, "index.css"), "utf8");

function extractRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`);
  const match = css.match(re);
  return match ? match[1] : null;
}

describe(".hq-input-dark", () => {
  const rule = extractRule(".hq-input-dark");

  it("rule exists", () => {
    expect(rule).not.toBeNull();
  });

  it("has font-size: 13px", () => {
    expect(rule).toMatch(/font-size:\s*13px/);
  });

  it("has padding: 9px 10px", () => {
    expect(rule).toMatch(/padding:\s*9px 10px/);
  });

  it("has a 1.5px solid #9a7a30 border", () => {
    const hasShorthand = /border:\s*1\.5px solid #9a7a30/.test(rule);
    const hasLonghand = /border-width:\s*1\.5px/.test(rule) && /border-color:\s*#9a7a30/.test(rule);
    expect(hasShorthand || hasLonghand).toBe(true);
  });

  it("has height: auto", () => {
    expect(rule).toMatch(/height:\s*auto/);
  });
});
