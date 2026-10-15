// Keep chat workloads on the economical text model; audio models are separate.
const DEFAULT_CHAT_MODEL = "gpt-6-luna";
function resolveChatModel(value) {
  const model = String(value || "").trim();
  // Retired environment overrides must not silently keep production on GPT-4.
  return !model || /^gpt-4(?:o(?:-mini)?|\.1(?:-mini)?)(?:-\d{4}-\d{2}-\d{2})?$/.test(model)
    ? DEFAULT_CHAT_MODEL : model;
}
function buildChatRequest(options) {
  const request = { ...options, model: resolveChatModel(options.model) };
  if (request.model === DEFAULT_CHAT_MODEL) {
    request.reasoning_effort = "none";
    if (request.max_tokens != null) {
      request.max_completion_tokens = request.max_completion_tokens ?? request.max_tokens;
      delete request.max_tokens;
    }
  }
  return request;
}
module.exports = { DEFAULT_CHAT_MODEL, resolveChatModel, buildChatRequest };
