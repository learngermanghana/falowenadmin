// Keep unexpected HTML responses out of the JSON parser and preserve form data.
export async function organisationEnrolmentRequest(path, body, { staff = false, getToken = async () => null, fetchImpl = fetch } = {}) {
  const token = staff ? await getToken() : null;
  if (staff && !token) throw new Error("Sign in to Admin first.");
  let response;
  try {
    response = await fetchImpl(`/api/${path}`, {
      method: body ? "POST" : "GET", cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error("Could not connect to Falowen. Your entries are still here. Check your connection and retry.");
  }
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); } catch {
    throw new Error("The enrolment service returned an unexpected page and could not confirm your request. Your entries are still here. Please retry shortly or contact Falowen.");
  }
  if (!response.ok || data?.ok !== true) {
    throw new Error(data?.error || data?.message || `Request failed (HTTP ${response.status}). Please retry.`);
  }
  return data;
}
