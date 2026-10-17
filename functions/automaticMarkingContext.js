const { AsyncLocalStorage } = require('node:async_hooks');
const transport = new AsyncLocalStorage();
exports.withMarkingTransport = (callAi, work) => transport.run(callAi, work);
exports.markingTransport = async (url, options) => {
  if (url !== '/api/marking/ai' || !transport.getStore()) throw new Error('Unsupported automatic marking transport');
  const result = await transport.getStore()(JSON.parse(options.body));
  return { ok: true, json: async () => ({ result }) };
};
