import test from "node:test";
import assert from "node:assert/strict";
import { geminiGenerate } from "../src/adapters/gemini.js";

test("Gemini adapter fails closed without an API key", async () => {
  await assert.rejects(
    () => geminiGenerate({}, { prompt: "test" }),
    (error) => error?.message === "GEMINI_API_KEY_NOT_CONFIGURED"
  );
});

test("Gemini adapter fails closed when free mode is disabled", async () => {
  await assert.rejects(
    () => geminiGenerate({ GEMINI_API_KEY: "test", GEMINI_FREE_MODE: "0" }, { prompt: "test" }),
    (error) => error?.message === "GEMINI_FREE_MODE_DISABLED"
  );
});
