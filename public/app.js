const API_BASE = "";

const $ = (sel, root = document) => root.querySelector(sel);

const form = $("#register-form");
const userList = $("#user-list");
const listEmpty = $("#list-empty");
const listLoading = $("#list-loading");
const userCount = $("#user-count");
const healthBadge = $("#health-badge");
const toastRoot = $("#toast-root");

function showToast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  toastRoot.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity 0.25s";
    setTimeout(() => el.remove(), 250);
  }, 4500);
}

function setFieldError(name, message) {
  const input = form.elements[name];
  const errEl = $(`[data-for="${name}"]`);
  if (input) input.classList.toggle("invalid", Boolean(message));
  if (errEl) errEl.textContent = message || "";
}

function clearFieldErrors() {
  ["username", "password", "email", "name", "surname"].forEach((n) =>
    setFieldError(n, "")
  );
}

function validateUsername(value) {
  if (!value.trim()) return "Användarnamn krävs.";
  if (value.length <= 4 || value.length >= 25)
    return "Användarnamn måste vara 5–24 tecken.";
  if (!/^[a-z][a-z0-9]+$/.test(value))
    return "Endast små bokstäver och siffror, måste börja med bokstav.";
  return "";
}

function validateEmail(value) {
  if (!value.trim()) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return "Ogiltig e-postadress.";
  return "";
}

function validateRequiredIfPresent(value, label) {
  if (value === undefined || value === "") return "";
  if (!String(value).trim()) return `${label} får inte vara tomt om det anges.`;
  return "";
}

function buildPayload(formData) {
  const payload = {
    username: formData.get("username")?.trim(),
    password: formData.get("password"),
  };

  const email = formData.get("email")?.trim();
  const name = formData.get("name")?.trim();
  const surname = formData.get("surname")?.trim();

  if (email) payload.email = email;
  if (name) payload.name = name;
  if (surname) payload.surname = surname;

  return payload;
}

function validateForm(formData) {
  clearFieldErrors();
  let valid = true;

  const usernameErr = validateUsername(formData.get("username") || "");
  if (usernameErr) {
    setFieldError("username", usernameErr);
    valid = false;
  }

  const password = formData.get("password");
  if (!password) {
    setFieldError("password", "Lösenord krävs.");
    valid = false;
  }

  const emailErr = validateEmail(formData.get("email") || "");
  if (emailErr) {
    setFieldError("email", emailErr);
    valid = false;
  }

  const nameErr = validateRequiredIfPresent(formData.get("name"), "Förnamn");
  if (nameErr) {
    setFieldError("name", nameErr);
    valid = false;
  }

  const surnameErr = validateRequiredIfPresent(
    formData.get("surname"),
    "Efternamn"
  );
  if (surnameErr) {
    setFieldError("surname", surnameErr);
    valid = false;
  }

  return valid;
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.err === 1) {
    throw new Error(body.message || `Fel ${res.status}`);
  }
  return body;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString("sv-SE");
}

function renderUser(user) {
  const li = document.createElement("li");
  const initial = (user.name?.[0] || user.username?.[0] || "?").toUpperCase();
  const displayName =
    user.name && user.surname
      ? `${user.name} ${user.surname}`
      : user.name || user.username;

  li.innerHTML = `
    <div class="user-avatar" aria-hidden="true">${initial}</div>
    <div class="user-meta">
      <h3>${escapeHtml(displayName)}</h3>
      <span class="username">@${escapeHtml(user.username)}</span>
    </div>
    <div class="user-details">
      ${user.email ? `<span>✉ ${escapeHtml(user.email)}</span>` : ""}
      <span>Skapad ${formatDate(user.created)}</span>
      <span>Uppdaterad ${formatDate(user.modified)}</span>
    </div>
  `;
  return li;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function setListLoading(loading) {
  listLoading.hidden = !loading;
  if (loading) {
    userList.hidden = true;
    listEmpty.hidden = true;
  }
}

async function loadUsers() {
  setListLoading(true);
  try {
    const { data } = await api("/api/v1/");
    const users = Array.isArray(data) ? data : [];

    userList.innerHTML = "";
    userCount.textContent = String(users.length);

    if (users.length === 0) {
      listEmpty.hidden = false;
      userList.hidden = true;
    } else {
      listEmpty.hidden = true;
      userList.hidden = false;
      users.forEach((u) => userList.appendChild(renderUser(u)));
    }
  } catch (err) {
    showToast(err.message || "Kunde inte hämta användare", "error");
    listEmpty.hidden = false;
    userList.hidden = true;
  } finally {
    setListLoading(false);
  }
}

async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    if (data.status === "ok") {
      healthBadge.textContent = "API online";
      healthBadge.className = "health-badge ok";
    } else {
      throw new Error("unexpected");
    }
  } catch {
    healthBadge.textContent = "API offline";
    healthBadge.className = "health-badge err";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  if (!validateForm(formData)) return;

  const btn = $("#btn-submit");
  const label = $(".btn-label", btn);
  const spinner = $(".btn-spinner", btn);

  btn.disabled = true;
  label.hidden = true;
  spinner.hidden = false;

  try {
    const payload = buildPayload(formData);
    const { data } = await api("/api/v1/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    showToast(`Användare @${data.username} skapad!`);
    form.reset();
    clearFieldErrors();
    await loadUsers();
  } catch (err) {
    showToast(err.message || "Registrering misslyckades", "error");
  } finally {
    btn.disabled = false;
    label.hidden = false;
    spinner.hidden = true;
  }
});

form.addEventListener("reset", () => clearFieldErrors());

$("#btn-refresh").addEventListener("click", () => {
  loadUsers();
  checkHealth();
});

checkHealth();
loadUsers();
