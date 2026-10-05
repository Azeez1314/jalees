import OpenAI from "openai";

/** Swap vendors here only — see docs/architecture.md ("every external AI service sits behind a thin interface"). */
export const LLM_MODEL = "gpt-4o-mini";

let client: OpenAI | null = null;
export function llm(): OpenAI {
  return (client ??= new OpenAI());
}
