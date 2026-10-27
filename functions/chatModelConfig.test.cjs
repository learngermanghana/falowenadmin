const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DEFAULT_CHAT_MODEL, resolveChatModel, buildChatRequest } = require("./chatModelConfig");

test("all Falowen Admin text marking stays on GPT-6 Luna despite legacy or explicit overrides", () => {
  assert.equal(DEFAULT_CHAT_MODEL, "gpt-6-luna");
  for (const model of [undefined, " ", "gpt-4o", "gpt-4o-mini", "gpt-4.1",
    "gpt-5.5", "gpt-6-luna", "custom-model"]) {
    assert.equal(resolveChatModel(model), "gpt-6-luna");
  }
});

test("marking JSON contracts, response lengths, and sampling survive text AI migration", () => {
  const options = { model: "gpt-4o-mini", messages: [{ role: "user", content: "Hallo" }],
    temperature: 0.1, max_tokens: 2200, response_format: { type: "json_object" } };
  const request = buildChatRequest(options);
  assert.equal(request.model, "gpt-6-luna");
  assert.equal(request.reasoning_effort, "none");
  assert.equal(request.max_completion_tokens, 2200);
  assert.equal(request.max_tokens, undefined);
  assert.equal(request.temperature, 0.1);
  assert.deepEqual(request.messages, options.messages);
  assert.deepEqual(request.response_format, options.response_format);
  assert.equal(options.max_tokens, 2200);
});

test("a stale OPENAI_MARKING_MODEL value cannot downgrade assessment", () => {
  const original = { model: "custom-model", max_tokens: 160, temperature: 0.5 };
  assert.deepEqual(buildChatRequest(original), {
    model: "gpt-6-luna", max_completion_tokens: 160,
    temperature: 0.5, reasoning_effort: "none",
  });
  assert.equal(original.model, "custom-model");
});
