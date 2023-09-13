import {
  JWT_KEY,
  isLoggedIn,
  decryptData,
  base64ToAb,
  ab2str,
  importKeys,
  decryptField,
} from "./lib.js";

const DISPLAY_VALUE_PLACEHOLDER = "*****";

let secretsList = [];

if (!isLoggedIn()) {
  window.location.replace("/login");
} else {
  await loadSecrets();
  renderSecretsList(secretsList);

  const availableTags = document.getElementById("availableTags");
  availableTags.innerHTML = readAvailableTags(secretsList)
    .map((tag) => `<span class="tag is-light mr-2 mb-2">${tag}</span>`)
    .join("");

  const filterForm = document.getElementById("filterForm");
  filterForm.addEventListener("submit", onFilterFormSubmit);
}

function readAvailableTags(secrets) {
  return Array.from(
    new Set(
      secrets.flatMap((secret) =>
        secret.description.split(/\s+/).filter((t) => t.startsWith("#"))
      )
    )
  );
}

function onFilterFormSubmit(event) {
  event.preventDefault();

  const formData = new FormData(filterForm);
  const filterBy = formData.get("filterBy");
  renderSecretsList(secretsList, { filterBy });
}

function renderSecretsList(secrets, options) {
  const { filterBy } = options || {};
  const secretHtml = (id, name, encryptedValue, description = "") => `
  <li data-encrypted-value="${encryptedValue}" class="my-6 box">
    <div class="has-text-weight-semibold">${name}</div>
    <div class="is-family-code has-background-light my-2 p-2" data-display-value="${encryptedValue}">${DISPLAY_VALUE_PLACEHOLDER}</div>
    <div class="is-flex is-align-content-center my-2">
      <button class="button mr-2" data-toggle=${encryptedValue}>toggle</button>
      <button class="button mr-2" data-copy=${encryptedValue}>copy</button>
      <a href="edit-secret?id=${id}">Edit</a>
    </div>

    <p>${description}</p>
  </li>
  `;

  const secretsList = document.getElementById("secretsList");

  const items = secrets
    .filter((secret) => {
      if (!filterBy) {
        return true;
      }

      const negativeTags = (filterBy.match(/!#\w+\b/g) || []).map((tag) =>
        tag.replace("!", "")
      );
      const tags = (filterBy.match(/#\w+\b/g) || []).filter(
        (tag) => !negativeTags.includes(tag)
      );

      const positiveFilterPassed =
        tags.length > 0
          ? tags.some((tag) => secret.description.includes(tag))
          : true;

      return (
        positiveFilterPassed &&
        negativeTags.every((tag) => !secret.description.includes(tag))
      );
    })
    .map((secret) => {
      return secretHtml(
        secret._id,
        secret.name,
        secret.value,
        secret.description
      );
    })
    .join("");

  secretsList.innerHTML = items;

  secretsList.removeEventListener("click", onToggle);
  secretsList.addEventListener("click", onToggle);
  secretsList.removeEventListener("click", onCopy);
  secretsList.addEventListener("click", onCopy);
}

async function onToggle(event) {
  const encryptedValue = event.target?.dataset?.["toggle"];
  if (typeof encryptedValue === "string") {
    const container = document.querySelector(
      `[data-display-value="${encryptedValue}"]`
    );

    if (container.innerHTML === DISPLAY_VALUE_PLACEHOLDER) {
      const { keyTwo } = await importKeys();
      const decrypted = await decryptData(base64ToAb(encryptedValue), keyTwo);
      container.innerHTML = ab2str(decrypted);
    } else {
      container.innerHTML = DISPLAY_VALUE_PLACEHOLDER;
    }
  }
}

async function onCopy(event) {
  const encryptedValue = event.target?.dataset?.["copy"];
  if (typeof encryptedValue === "string") {
    const { keyTwo } = await importKeys();
    const decrypted = await decryptData(base64ToAb(encryptedValue), keyTwo);
    const text = ab2str(decrypted);
    navigator.clipboard.writeText(text);
  }
}

async function loadSecrets() {
  const resp = await fetch("/api/secrets", {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem(JWT_KEY)}`,
    },
  });
  if (!resp.ok) {
    console.error("Failed loading secrets");
    return;
  }

  const secrets = await resp.json();
  const secretsPartiallyDecrypted = await Promise.all(
    secrets.map(async (secretData) => {
      const name = await decryptField("secretName", secretData.name);
      const description = await decryptField(
        "secretDescription",
        secretData.description
      );

      return { ...secretData, name, description };
    })
  );

  secretsList = secretsPartiallyDecrypted;
}
