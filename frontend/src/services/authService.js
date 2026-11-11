const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api";

async function readResponse(response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    throw new Error(
      "The server returned an invalid response. Please try again.",
    );
  }

  return response.json();
}

async function sendAuthRequest(endpoint, payload) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "Unable to connect to the server. Make sure the backend is running.",
    );
  }

  const result = await readResponse(response);

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Authentication request failed. Please try again.",
    );
  }

  return result;
}

export async function registerUser(userData) {
  const result = await sendAuthRequest("register", {
    fullName: userData.fullName.trim(),
    email: userData.email.trim().toLowerCase(),
    phone: userData.phone.trim(),
    dateOfBirth: userData.dateOfBirth,
    password: userData.password,
  });

  if (!result.user) {
    throw new Error(
      "Missing Your Information Register Yourself First",
    );
  }

  return result;
}

export async function loginUser(credentials) {
  const result = await sendAuthRequest("login", {
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
  });

  if (!result.token || !result.user) {
    throw new Error("Login response is missing authentication information.");
  }

  return result;
}