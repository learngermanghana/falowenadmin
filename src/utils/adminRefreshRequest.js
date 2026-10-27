export function createAdminRefreshRequest(load, callbacks) {
  let active = true;
  let request = null;
  return {
    run() {
      if (!active) return Promise.resolve(null);
      if (request) return request;
      callbacks.onStart();
      request = Promise.resolve().then(load).then(data => {
        if (active) callbacks.onSuccess(data, new Date());
        return data;
      }).catch(error => {
        if (active) callbacks.onError(error);
        return null;
      }).finally(() => {
        request = null;
        if (active) callbacks.onFinish();
      });
      return request;
    },
    dispose() { active = false; },
  };
}
