import { str2ab } from "./lib";

function encryptValue(value, key) {
  const data = str2ab(value);

  return window.crypto.subtle.encrypt(
    {
      name: "AES-CTR",
      //Don't re-use counters!
      //Always use a new counter every time your encrypt!
      counter: new Uint8Array(16),
      length: 128, //can be 1-128
    },
    key, //from generateKey or importKey above
    data //ArrayBuffer of data you want to encrypt
  );
}
