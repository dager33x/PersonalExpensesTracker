const form = document.getElementById("forgot-form");
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

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();

  const email = document.getElementById("email").value.trim();

  if (!email) {
    showError("Enter your email to continue.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

  try {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not send reset link");
    }

    showMessage(data.message || "Reset link sent. Check your inbox.");
  } catch (error) {
    showError(error.message || "Something went wrong");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send reset link";
  }
});

