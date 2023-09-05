import { STORAGE_KEY, base64ToAb } from "./lib";

function importKey() {
  const loadedBuffer = base64ToAb(sessionStorage.getItem(STORAGE_KEY));

  return window.crypto.subtle.importKey(
    "raw", //can be "jwk" or "raw"
    loadedBuffer,
    {
      //this is the algorithm options
      name: "AES-CTR",
    },
    false, //whether the key is extractable (i.e. can be used in exportKey)
    ["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
  );
}

async function decryptData(data) {
  const key = await importKey();

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
