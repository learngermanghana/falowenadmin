export const isHistoricalSchedulePayload = (payload = {}) => payload.historicalMode === true || payload.historical === true;
