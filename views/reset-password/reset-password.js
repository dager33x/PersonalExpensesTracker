const form = document.getElementById("reset-form");
const submitBtn = document.getElementById("submit-btn");
const messageEl = document.getElementById("message");
const errorEl = document.getElementById("error");

function showMessage(text) {
  messageEl.textContent = text;
  messageEl.classList.add("visible");
  errorEl.classList.remove("visible");
}

function showError(text) {
  errorEl.textContent = text;
  errorEl.classList.add("visible");
  messageEl.classList.remove("visible");
}

function clearMessages() {
  messageEl.classList.remove("visible");
  errorEl.classList.remove("visible");
}

const token = new URLSearchParams(window.location.search).get("token");

if (!token) {
  showError("Reset link is missing or invalid.");
  submitBtn.disabled = true;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (!password || !confirmPassword) {
    showError("Fill in both password fields.");
    return;
  }

  if (password !== confirmPassword) {
    showError("Passwords don't match.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Updating...";

  try {
    const response = await fetch(`/api/auth/reset-password/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not update password");
    }

    showMessage(data.message || "Password updated. Redirecting to sign in...");

    setTimeout(() => {
      window.location.href = "/login?reset=1";
    }, 1200);
  } catch (error) {
    showError(error.message || "Something went wrong");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Update password";
  }
});

