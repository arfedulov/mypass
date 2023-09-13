import { JWT_KEY, isLoggedIn, decryptField, encryptField } from "./lib.js";

const VALUE_PLACEHOLDER = "*****";

const nameElement = document.getElementById("secretName");
const valueElement = document.getElementById("secretValue");
const descriptionElement = document.getElementById("secretDescription");

let secretData = null;

if (!isLoggedIn()) {
  window.location.replace("/login");
} else {
  await loadSecretData();
}

const currentState = document.getElementById("currentState");
currentState.addEventListener("click", onEditSecret);

const editSecretForm = document.getElementById("editSecretForm");
editSecretForm.addEventListener("submit", onEditSecretFormSubmit);

const toggleSecretValue = document.getElementById("toggleSecretValue");
toggleSecretValue.addEventListener("click", onToggleSecretValue);

async function onEditSecret(event) {
  const fieldName = event.target?.dataset?.["fieldName"];
  if (!fieldName) {
    return;
  }

  let currentValue = "";
  if (fieldName === "secretName") {
    currentValue = nameElement.innerText;
  } else if (fieldName === "secretDescription") {
    currentValue = descriptionElement.innerText;
  } else if (fieldName === "secretValue") {
    if (valueElement.innerText === VALUE_PLACEHOLDER) {
      currentValue = await decryptField("secretValue", secretData.value);
    } else {
      currentValue = valueElement.innerText;
    }
  }

  renderEditField(fieldName, currentValue);
}

async function onToggleSecretValue() {
  const curValue = valueElement.innerText;
  if (curValue === VALUE_PLACEHOLDER) {
    valueElement.innerText = await decryptField(
      "secretValue",
      secretData.value
    );
  } else {
    valueElement.innerText = VALUE_PLACEHOLDER;
  }
}

async function onEditSecretFormSubmit(event) {
  event.preventDefault();

  const formData = new FormData(editSecretForm);
  const encryptedEntries = await Promise.all(
    Array.from(formData.entries()).map(async ([fieldName, fieldValue]) => {
      const encryptedValue = await encryptField(fieldName, fieldValue);
      return [fieldName, encryptedValue];
    })
  );
  const encryptedData = Object.fromEntries(
    encryptedEntries.map(([fieldName, fieldValue]) => {
      const key = fieldName.replace("secret", "").toLowerCase();
      return [key, fieldValue];
    })
  );

  const params = new URLSearchParams(window.location.search);
  const secretId = params.get("id");

  const res = await fetch(`/api/secret/${secretId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem(JWT_KEY)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(encryptedData),
  });
  if (res.ok) {
    hideEditField();
    await loadSecretData();
  } else {
    console.error("update secret failed");
  }
}

async function loadSecretData() {
  const params = new URLSearchParams(window.location.search);
  const secretId = params.get("id");
  if (!secretId) {
    console.error("Missing required parameter 'id'");
    return;
  }

  const resp = await fetch(`/api/secret/${secretId}`, {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem(JWT_KEY)}`,
    },
  });
  if (!resp.ok) {
    console.error("Failed loading a secret");
    return;
  }
  secretData = await resp.json();
  renderSecretData(secretData);
}

async function renderSecretData(secret) {
  nameElement.innerText = await decryptField("secretName", secret.name);
  valueElement.innerText = VALUE_PLACEHOLDER;
  descriptionElement.innerText = await decryptField(
    "secretDescription",
    secret.description
  );
}

function renderEditField(fieldName, currentValue) {
  let html = "";
  if (fieldName === "secretName") {
    html = `
    <div class="field">
      <label for="secretName" class="label">Name</label>
      <div class="control">
        <input
          id="secretName"
          class="input"
          type="text"
          name="secretName"
          required
          value="${currentValue}"
        />
      </div>
    </div>
    <div class=control>
      <button class="button">Save</button>
    </div>
    `;
  } else if (fieldName === "secretValue") {
    html = `
    <div class="field">
      <label for="secretValue" class="label">Value</label>
      <div class="control">
        <input class="input" type="password" name="secretValue" value="${currentValue}" />
      </div>
    </div>
    <div class=control>
      <button class="button">Save</button>
    </div>
    `;
  } else if (fieldName === "secretDescription") {
    html = `
    <div class="field">
      <label for="secretDescription" class="label">Description</label>
      <textarea
        id="secretDescription"
        class="textarea"
        placeholder="e.g. #mysite #password"
        name="secretDescription"
      >${currentValue}</textarea>
    </div>
    <div class=control>
      <button class="button">Save</button>
    </div>
    `;
  }

  editSecretForm.innerHTML = html;
  editSecretForm.removeAttribute("hidden");
}

function hideEditField() {
  editSecretForm.innerHTML = "";
  editSecretForm.setAttribute("hidden", "");
}
