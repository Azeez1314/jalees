/**
 * Splits a SQL file into single statements for the Neon HTTP driver (one statement per call).
 * Comments are removed first, so a ";" inside a comment can't cut a statement in half.
 * Limits: no `--` or `;` inside string literals and no function bodies — true of db/schema.sql; revisit if that changes.
 */
export function splitStatements(sqlText: string): string[] {
  return sqlText
    .replace(/--[^\n]*/g, "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}
