const form = document.getElementById("signup-form");
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

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessages();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const sex = document.getElementById("sex").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const normalizedPassword = password.trim();
  const normalizedConfirmPassword = confirmPassword.trim();

  if (!name || !email || !sex || !password || !confirmPassword) {
    showError("Fill in every field to create your account.");
    return;
  }

  if (normalizedPassword.length < 8) {
    showError("Password must be at least 8 characters.");
    return;
  }

  if (normalizedPassword !== normalizedConfirmPassword) {
    showError("Passwords don't match. Check for extra spaces.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account...";

  try {
    const response = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, sex, password: normalizedPassword }),
      });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not create account");
    }

    showMessage(data.message || "Account created. Check your inbox to verify your email.");

    setTimeout(() => {
      window.location.href = "/login?signup=1";
    }, 1200);
  } catch (err) {
    showError(err.message || "Something went wrong");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Account";
  }
});
