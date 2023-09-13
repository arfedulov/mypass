export const SECRET_KEY_ONE_KEY = "mypass_key_one";
export const SECRET_KEY_TWO_KEY = "mypass_key_two";
export const JWT_KEY = "jwt_key";

export function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}
export function str2ab(str) {
  const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  const bufView = new Uint16Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

export function ab2Base64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return window.btoa(binary);
}

export function base64ToAb(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function importKeyFromBuffer(buffer) {
  return window.crypto.subtle.importKey(
    "raw", //can be "jwk" or "raw"
    buffer,
    {
      //this is the algorithm options
      name: "AES-CTR",
    },
    false, //whether the key is extractable (i.e. can be used in exportKey)
    ["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
  );
}

export async function importKeys() {
  const bufferOne = base64ToAb(sessionStorage.getItem(SECRET_KEY_ONE_KEY));
  const bufferTwo = base64ToAb(sessionStorage.getItem(SECRET_KEY_TWO_KEY));

  const keyOne = await importKeyFromBuffer(bufferOne);
  const keyTwo = await importKeyFromBuffer(bufferTwo);

  return { keyOne, keyTwo };
}

export async function decryptData(data, key) {
  return window.crypto.subtle.decrypt(
    {
      name: "AES-CTR",
      counter: new ArrayBuffer(16), //The same counter you used to encrypt
      length: 128, //The same length you used to encrypt
    },
    key, //from generateKey or importKey above
    data //ArrayBuffer of the data
  );
}

export function readFileToString(file) {
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

export function generateKey() {
  return window.crypto.subtle.generateKey(
    {
      name: "AES-CTR",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export function exportKey(key) {
  return window.crypto.subtle.exportKey(
    "raw", //can be "jwk" or "raw"
    key //extractable must be true
  );
}

export function downloadKeys(keyOneBuffer, keyTwoBuffer) {
  const a = document.createElement("a");
  const blob = new Blob(
    [ab2Base64(keyOneBuffer), "\n", ab2Base64(keyTwoBuffer)],
    {
      type: "application/secret",
    }
  );
  a.href = window.URL.createObjectURL(blob);
  a.download = "mypass_keys.secret";
  a.click();
}

function isJwtExpired(jwt) {
  try {
    const jwtPayload = JSON.parse(window.atob(jwt.split(".")[1]));
    return Date.now() >= jwtPayload.exp * 1000;
  } catch (err) {
    console.error("Error parsing jwt");
  }

  return true;
}

export function isLoggedIn() {
  const hasKeys =
    !!sessionStorage.getItem(SECRET_KEY_ONE_KEY) &&
    !!sessionStorage.getItem(SECRET_KEY_TWO_KEY);
  const jwt = sessionStorage.getItem(JWT_KEY);

  return hasKeys && !isJwtExpired(jwt);
}

export function encryptData(data, key) {
  const dataAb = str2ab(data);

  return window.crypto.subtle.encrypt(
    {
      name: "AES-CTR",
      //Don't re-use counters!
      //Always use a new counter every time your encrypt!
      counter: new Uint8Array(16),
      length: 128, //can be 1-128
    },
    key, //from generateKey or importKey above
    dataAb //ArrayBuffer of data you want to encrypt
  );
}

export async function encryptField(fieldName, fieldValue) {
  const keys = await importKeys();
  const key = fieldName === "secretValue" ? keys.keyTwo : keys.keyOne;
  return ab2Base64(await encryptData(fieldValue, key));
}

export async function decryptField(fieldName, encryptedFieldValue) {
  const keys = await importKeys();
  const key = fieldName === "secretValue" ? keys.keyTwo : keys.keyOne;
  return ab2str(await decryptData(base64ToAb(encryptedFieldValue), key));
}
