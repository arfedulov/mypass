import {
  JWT_KEY,
  SECRET_KEY_ONE_KEY,
  SECRET_KEY_TWO_KEY,
  readFileToString,
} from "./lib.js";

const secretKeyForm = document.getElementById("secretKeyForm");
secretKeyForm.addEventListener("submit", onSecretKeySubmit);

async function onSecretKeySubmit(event) {
  event.preventDefault();

  const formData = new FormData(secretKeyForm);
  const file = formData.get("secretKey");
  const fileContent = await readFileToString(file);
  const [keyOne, keyTwo] = fileContent.split("\n");

  sessionStorage.setItem(SECRET_KEY_ONE_KEY, keyOne);
  sessionStorage.setItem(SECRET_KEY_TWO_KEY, keyTwo);

  window.location.replace("/");
}

const loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", onLoginSubmit);

async function onLoginSubmit(event) {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const resp = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(Object.fromEntries(formData.entries())),
  });
  if (!resp.ok) {
    alert("Failed to login");
    return;
  }

  const data = await resp.json();
  if (!data.jwt) {
    console.error("missing jwt in response");
    alert("Failed to login");
    return;
  }

  sessionStorage.setItem(JWT_KEY, data.jwt);
  renderSecretKeyForm();
}

function renderSecretKeyForm() {
  loginForm.setAttribute("hidden", "");
  secretKeyForm.removeAttribute("hidden");
}
