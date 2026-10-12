export function createTimedAttemptListenerHealth(sourceCount) {
  const states = Array.from({ length: sourceCount }, () => ({ ready: false, error: "" }));
  const status = () => {
    const error = states.map(state => state.error).filter(Boolean).join(" · ");
    return { loading: !error && !states.every(state => state.ready), error };
  };
  return {
    snapshot(index) {
      states[index] = { ready: true, error: "" };
      return status();
    },
    failure(index, error) {
      states[index] = {
        ready: false,
        error: error?.message || "Could not load timed assignments.",
      };
      return status();
    },
  };
}
