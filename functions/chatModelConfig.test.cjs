const { test } = require("node:test");
const assert = require("node:assert/strict");
const { resolveChatModel, buildChatRequest } = require("./chatModelConfig");
test("retired defaults and environment overrides migrate, specialized models stay separate", () => {
  for (const model of [undefined, " ", "gpt-4o-mini", "gpt-4o", "gpt-4.1", "gpt-4.1-mini-2025-04-14"])
    assert.equal(resolveChatModel(model), "gpt-6-luna");
  for (const model of ["gpt-4o-transcribe", "gpt-4o-mini-tts", "custom-model"])
    assert.equal(resolveChatModel(model), model);
});
test("JSON contracts, messages, sampling and token budgets survive migration without reasoning spend", () => {
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
test("explicit custom models retain their request contract", () => {
  const options = { model: "custom-model", max_tokens: 160, temperature: 0.5 };
  assert.deepEqual(buildChatRequest(options), options);
});
