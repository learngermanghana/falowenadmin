// Falowen Admin's marking and feedback are text AI workloads.
// Audio transcription / speech synthesis use separate compatible API models.
const DEFAULT_CHAT_MODEL = "gpt-6-luna";

// Legacy OPENAI_MARKING_MODEL overrides must not downgrade the shared
// Falowen / Falowen Admin assessment language model.
function resolveChatModel(_requestedModel) {
  return DEFAULT_CHAT_MODEL;
}
function buildChatRequest(options) {
  const request = { ...options, model: resolveChatModel(options.model) };
  request.reasoning_effort = "none";
  if (request.max_tokens != null) {
    request.max_completion_tokens = request.max_completion_tokens ?? request.max_tokens;
    delete request.max_tokens;
  }
  return request;
}
module.exports = { DEFAULT_CHAT_MODEL, resolveChatModel, buildChatRequest };
