import { downloadKeys, exportKey, generateKey } from "./lib.js";

const downloadButton = document.getElementById("downloadButton");
downloadButton.addEventListener("click", downloadNewSecretKey);

async function downloadNewSecretKey() {
  const keyOne = await generateKey();
  const keyTwo = await generateKey();
  const keyOneBuffer = await exportKey(keyOne);
  const keyTwoBuffer = await exportKey(keyTwo);

  downloadKeys(keyOneBuffer, keyTwoBuffer);
}
