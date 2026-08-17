// Pure dot-path dictionary lookup with {varName} interpolation.
// No React, no side effects — safe to unit test in isolation.

export function t(dict, key, vars) {
  const resolved = key.split(".").reduce((acc, segment) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return acc[segment];
  }, dict);

  if (typeof resolved !== "string") return key;

  if (!vars) return resolved;

  return resolved.replace(/\{(\w+)\}/g, (match, varName) =>
    Object.prototype.hasOwnProperty.call(vars, varName) ? String(vars[varName]) : match
  );
}
