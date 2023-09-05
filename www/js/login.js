import { ab2Base64 } from "./lib";

const keyForm = document.getElementById("keyForm");
keyForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = new FormData(keyForm);
  const file = data.get("key");
  const key = await readFileToString(file);

  localStorage.setItem(STORAGE_KEY, key);
});

function readFileToString(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (evt) {
      if (evt.target.readyState != 2) return;
      if (evt.target.error) {
        reject("Error while reading file");
        return;
      }

      resolve(evt.target.result);
    };

    reader.readAsText(file);
  });
}

function generateKey() {
  return window.crypto.subtle.generateKey(
    {
      name: "AES-CTR",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

function exportKey(key) {
  return window.crypto.subtle.exportKey(
    "raw", //can be "jwk" or "raw"
    key //extractable must be true
  );
}

function downloadKey(key) {
  const a = document.createElement("a");
  const blob = new Blob([ab2Base64(key)], {
    type: "text/plain",
  });
  a.href = window.URL.createObjectURL(blob);
  a.download = "mypass_main_key";
  a.click();
}
