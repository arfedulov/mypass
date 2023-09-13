import {
  isLoggedIn,
  encryptData,
  importKeys,
  JWT_KEY,
  ab2Base64,
} from "./lib.js";

if (!isLoggedIn()) {
  window.location.replace("/login");
}

const addSecretForm = document.getElementById("addSecretForm");
addSecretForm.addEventListener("submit", onAddSecretFormSubmit);

const formError = document.getElementById("formError");

async function onAddSecretFormSubmit(event) {
  event.preventDefault();
  clearFormError();

  const formData = new FormData(addSecretForm);
  const secretName = formData.get("secretName");
  const secretValue = formData.get("secretValue");
  const secretDescription = formData.get("secretDescription");

  const { keyOne, keyTwo } = await importKeys();
  const secretNameEncrypted = ab2Base64(await encryptData(secretName, keyOne));
  const secretValueEncrypted = ab2Base64(
    await encryptData(secretValue, keyTwo)
  );
  const secretDescriptionEncrypted = ab2Base64(
    await encryptData(secretDescription, keyOne)
  );

  const transportableData = {
    secretNameEncrypted,
    secretValueEncrypted,
    secretDescriptionEncrypted,
  };

  const resp = await fetch("/api/add-secret", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem(JWT_KEY)}`,
    },
    body: JSON.stringify(transportableData),
  });

  if (!resp.ok) {
    setFormError("Failed adding a secret");
    return;
  }

  window.location.assign("/");
}

function setFormError(err) {
  formError.querySelector("[data-error-body]").innerText = err;
  formError.removeAttribute("hidden");
}
function clearFormError() {
  formError.querySelector("[data-error-body]").innerText = "";
  formError.setAttribute("hidden", "");
}
