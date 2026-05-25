const API_BASE = "";
const AVATAR_COUNT = 5;
const SESSION_KEY = "caf_session";

const $ = (sel, root = document) => root.querySelector(sel);

const form = $("#register-form");
const userList = $("#user-list");
const listEmpty = $("#list-empty");
const listLoading = $("#list-loading");
const userCount = $("#user-count");
const healthBadge = $("#health-badge");
const toastRoot = $("#toast-root");
const wallForm = $("#wall-form");
const wallList = $("#wall-list");
const wallEmpty = $("#wall-empty");
const wallLoading = $("#wall-loading");
const wallChars = $("#wall-chars");
const wallMessage = $("#wall-message");
const loginForm = $("#login-form");
const sessionBar = $("#session-bar");
const sessionProfileLink = $("#session-profile-link");
const viewHome = $("#view-home");
const viewProfile = $("#view-profile");

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession({ token, user }) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
  updateSessionUI();
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  updateSessionUI();
}

function authHeaders() {
  const session = getSession();
  if (!session?.token) return {};
  return { Authorization: `Bearer ${session.token}` };
}

function avatarUrl(id) {
  const n = Math.min(AVATAR_COUNT, Math.max(1, Number(id) || 1));
  return `/avatars/${n}.svg`;
}

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

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function displayName(user) {
  if (user.name && user.surname) return `${user.name} ${user.surname}`;
  if (user.name) return user.name;
  return user.username;
}

function buildAvatarPicker(container, selectedId, onSelect) {
  container.innerHTML = "";
  for (let i = 1; i <= AVATAR_COUNT; i++) {
    const label = document.createElement("label");
    label.className = "avatar-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "avatar_pick";
    input.value = String(i);
    input.checked = i === selectedId;
    const img = document.createElement("img");
    img.src = avatarUrl(i);
    img.alt = `Avatar ${i}`;
    img.width = 48;
    img.height = 48;
    label.append(input, img);
    input.addEventListener("change", () => onSelect(i));
    container.appendChild(label);
  }
}

function updateSessionUI() {
  const session = getSession();
  if (session?.user?.username) {
    sessionBar.hidden = false;
    loginForm.hidden = true;
    sessionProfileLink.href = `#/profile/${session.user.username}`;
    sessionProfileLink.innerHTML = `<img src="${avatarUrl(session.user.avatar_id)}" alt="" width="28" height="28" class="avatar-inline" /> @${escapeHtml(session.user.username)}`;
  } else {
    sessionBar.hidden = true;
    loginForm.hidden = false;
  }
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.err === 1) {
    throw new Error(body.message || `Fel ${res.status}`);
  }
  return body;
}

function updateListView(mode) {
  listLoading.hidden = mode !== "loading";
  listEmpty.hidden = mode !== "empty";
  userList.hidden = mode !== "users";
}

function updateWallView(mode) {
  wallLoading.hidden = mode !== "loading";
  wallEmpty.hidden = mode !== "empty";
  wallList.hidden = mode !== "posts";
}

function renderUser(user) {
  const li = document.createElement("li");
  const name = displayName(user);
  li.innerHTML = `
    <a href="#/profile/${encodeURIComponent(user.username)}" class="user-row-link">
      <img class="user-avatar-img" src="${avatarUrl(user.avatar_id)}" alt="" width="48" height="48" />
      <div class="user-meta">
        <h3>${escapeHtml(name)}</h3>
        <span class="username">@${escapeHtml(user.username)}</span>
        ${user.bio ? `<p class="user-bio-preview">${escapeHtml(user.bio)}</p>` : ""}
      </div>
    </a>
  `;
  return li;
}

function renderWallPost(post) {
  const li = document.createElement("li");
  li.innerHTML = `
    <div class="wall-meta">
      <a href="#/profile/${encodeURIComponent(post.username)}"><strong>@${escapeHtml(post.username)}</strong></a>
      <time>${escapeHtml(post.created)}</time>
    </div>
    <p class="wall-text">${escapeHtml(post.message)}</p>
  `;
  return li;
}

async function loadUsers() {
  updateListView("loading");
  try {
    const { data } = await api("/api/v1/");
    const users = Array.isArray(data) ? data : [];
    userList.innerHTML = "";
    userCount.textContent = String(users.length);
    if (users.length === 0) {
      updateListView("empty");
    } else {
      users.forEach((u) => userList.appendChild(renderUser(u)));
      updateListView("users");
    }
  } catch (err) {
    showToast(err.message || "Kunde inte hämta medlemmar", "error");
    updateListView("empty");
  }
}

async function loadWall() {
  updateWallView("loading");
  try {
    const { data } = await api("/api/v1/wall");
    const posts = Array.isArray(data) ? data : [];
    wallList.innerHTML = "";
    if (posts.length === 0) {
      updateWallView("empty");
    } else {
      posts.forEach((p) => wallList.appendChild(renderWallPost(p)));
      updateWallView("posts");
    }
  } catch (err) {
    showToast(err.message || "Kunde inte hämta väggen", "error");
    updateWallView("empty");
  }
}

async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    if (data.status === "ok") {
      healthBadge.textContent = "API online";
      healthBadge.className = "health-badge ok";
    } else throw new Error();
  } catch {
    healthBadge.textContent = "API offline";
    healthBadge.className = "health-badge err";
  }
}

function setFieldError(name, message) {
  const input = form?.elements[name];
  const errEl = $(`[data-for="${name}"]`);
  if (input) input.classList.toggle("invalid", Boolean(message));
  if (errEl) errEl.textContent = message || "";
}

function clearFieldErrors() {
  ["username", "password", "email"].forEach((n) => setFieldError(n, ""));
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Ogiltig e-postadress.";
  return "";
}

function buildPayload(formData) {
  const payload = {
    username: formData.get("username")?.trim(),
    password: formData.get("password"),
    avatar_id: Number(formData.get("avatar_id") || 1),
  };
  const bio = formData.get("bio")?.trim();
  const email = formData.get("email")?.trim();
  const name = formData.get("name")?.trim();
  const surname = formData.get("surname")?.trim();
  if (bio) payload.bio = bio;
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
  if (!formData.get("password")) {
    setFieldError("password", "Lösenord krävs.");
    valid = false;
  }
  const emailErr = validateEmail(formData.get("email") || "");
  if (emailErr) {
    setFieldError("email", emailErr);
    valid = false;
  }
  return valid;
}

async function handleLogin(e) {
  e.preventDefault();
  const username = $("#login-username").value.trim();
  const password = $("#login-password").value;
  if (!username || !password) {
    showToast("Ange användarnamn och lösenord.", "error");
    return;
  }
  try {
    const { data } = await api("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setSession(data);
    loginForm.reset();
    showToast(`Välkommen @${data.user.username}!`);
    await loadWall();
  } catch (err) {
    showToast(err.message || "Inloggning misslyckades", "error");
  }
}

function parseRoute() {
  const hash = location.hash.slice(1) || "/";
  const match = hash.match(/^\/profile\/([^/]+)/);
  if (match) return { view: "profile", username: decodeURIComponent(match[1]) };
  return { view: "home" };
}

function showView(route) {
  if (route.view === "profile") {
    viewHome.hidden = true;
    viewProfile.hidden = false;
    loadProfile(route.username);
  } else {
    viewHome.hidden = false;
    viewProfile.hidden = true;
  }
}

async function loadProfile(username) {
  const loading = $("#profile-loading");
  const content = $("#profile-content");
  const notFound = $("#profile-not-found");
  const edit = $("#profile-edit");

  loading.hidden = false;
  content.hidden = true;
  notFound.hidden = true;
  edit.hidden = true;

  try {
    const { data } = await api(`/api/v1/users/${encodeURIComponent(username)}`);
    loading.hidden = true;
    content.hidden = false;

    $("#profile-avatar").src = avatarUrl(data.avatar_id);
    $("#profile-avatar").alt = `Avatar för @${data.username}`;
    $("#profile-display-name").textContent = displayName(data);
    $("#profile-username").textContent = `@${data.username}`;
    $("#profile-bio").textContent = data.bio || "Ingen presentation ännu.";
    $("#profile-meta").textContent = `Medlem sedan ${data.created}`;

    const posts = data.posts || [];
    const postsEl = $("#profile-posts");
    const postsEmpty = $("#profile-posts-empty");
    postsEl.innerHTML = "";
    if (posts.length === 0) {
      postsEmpty.hidden = false;
    } else {
      postsEmpty.hidden = true;
      posts.forEach((p) => postsEl.appendChild(renderWallPost(p)));
    }

    if (data.isOwner) {
      edit.hidden = false;
      let selectedAvatar = data.avatar_id || 1;
      buildAvatarPicker($("#profile-avatar-options"), selectedAvatar, (id) => {
        selectedAvatar = id;
      });
      $("#edit-bio").value = data.bio || "";
      $("#edit-name").value = data.name || "";
      $("#edit-surname").value = data.surname || "";

      $("#btn-save-profile").onclick = async () => {
        try {
          const { data: updated } = await api(
            `/api/v1/users/${encodeURIComponent(username)}`,
            {
              method: "PATCH",
              body: JSON.stringify({
                avatar_id: selectedAvatar,
                bio: $("#edit-bio").value.trim(),
                name: $("#edit-name").value.trim() || undefined,
                surname: $("#edit-surname").value.trim() || undefined,
              }),
            }
          );
          const session = getSession();
          if (session) {
            setSession({ token: session.token, user: updated });
          }
          showToast("Profil sparad!");
          loadProfile(username);
          loadUsers();
        } catch (err) {
          showToast(err.message, "error");
        }
      };

      $("#btn-delete-profile").onclick = async () => {
        const pw = $("#delete-password").value;
        if (!pw) {
          showToast("Ange lösenord för att radera kontot.", "error");
          return;
        }
        if (!confirm("Radera ditt konto permanent? Det går inte att ångra.")) return;
        try {
          await api(`/api/v1/users/${encodeURIComponent(username)}`, {
            method: "DELETE",
            body: JSON.stringify({ password: pw }),
          });
          clearSession();
          showToast("Kontot är raderat.");
          location.hash = "#/";
          loadUsers();
          loadWall();
        } catch (err) {
          showToast(err.message, "error");
        }
      };
    }
  } catch (err) {
    loading.hidden = true;
    if (err.message?.includes("finns inte")) {
      notFound.hidden = false;
    } else {
      showToast(err.message, "error");
      notFound.hidden = false;
    }
  }
}

form?.addEventListener("submit", async (e) => {
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
    const { data } = await api("/api/v1/", {
      method: "POST",
      body: JSON.stringify(buildPayload(formData)),
    });
    showToast(`Konto @${data.username} skapat! Logga in för att posta.`);
    form.reset();
    $("#avatar_id").value = "1";
    buildAvatarPicker($("#avatar-options"), 1, (id) => {
      $("#avatar_id").value = String(id);
    });
    clearFieldErrors();
    await loadUsers();
  } catch (err) {
    const msg = err.message || "Registrering misslyckades";
    if (msg.includes("email already")) showToast("E-posten är redan registrerad.", "error");
    else if (msg.includes("user already")) showToast("Användarnamnet finns redan.", "error");
    else showToast(msg, "error");
  } finally {
    btn.disabled = false;
    label.hidden = false;
    spinner.hidden = true;
  }
});

wallForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const session = getSession();
  if (!session?.user?.username) {
    showToast("Logga in för att posta på väggen.", "error");
    return;
  }
  const message = wallMessage.value.trim();
  if (!message) {
    showToast("Skriv ett meddelande.", "error");
    return;
  }
  try {
    await api("/api/v1/wall", {
      method: "POST",
      body: JSON.stringify({ username: session.user.username, message }),
    });
    showToast("Inlägg publicerat!");
    wallForm.reset();
    wallChars.textContent = "0";
    await loadWall();
  } catch (err) {
    showToast(err.message || "Kunde inte publicera", "error");
  }
});

wallMessage?.addEventListener("input", () => {
  wallChars.textContent = String(wallMessage.value.length);
});

loginForm?.addEventListener("submit", handleLogin);
$("#btn-logout")?.addEventListener("click", () => {
  clearSession();
  showToast("Du är utloggad.");
});
$("#btn-refresh")?.addEventListener("click", () => {
  loadUsers();
  loadWall();
  checkHealth();
  const route = parseRoute();
  if (route.view === "profile") loadProfile(route.username);
});

window.addEventListener("hashchange", () => showView(parseRoute()));

buildAvatarPicker($("#avatar-options"), 1, (id) => {
  $("#avatar_id").value = String(id);
});

updateSessionUI();
checkHealth();
loadUsers();
loadWall();
showView(parseRoute());
