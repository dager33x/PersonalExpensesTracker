const form = document.getElementById("login-form");
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

const params = new URLSearchParams(window.location.search);
if (params.get("verified") === "1") {
  showMessage("Email verified. You can sign in now.");
} else if (params.get("verified") === "0") {
  showError("Verification link is invalid or expired.");
} else if (params.get("reset") === "1") {
  showMessage("Password updated successfully. Sign in with your new password.");
} else if (params.get("signup") === "1") {
  showMessage("Account created. Check your email to verify your account.");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessages();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showError("Enter your email and password to continue.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Signing in...";

  try {
    const response = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // sends/receives the JWT cookie set by cookie-parser
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    showMessage(data.message || "Logged in successfully");

    // TODO(backend): point this at your real dashboard route
    window.location.href = "/dashboard";
  } catch (err) {
    showError(err.message || "Something went wrong");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign In";
  }
});
