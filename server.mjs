import express from "express";
import { generateJwt, verifyJwt } from "./server/lib.mjs";
import {
  getUser,
  addSecret,
  getSecrets,
  updateSecret,
  getSecret,
} from "./server/db.mjs";
import bodyParser from "body-parser";

const app = express();
app.use((req, res, next) => {
  res.set("Content-Security-Policy", "default-src 'self';");
  next();
});
app.use(express.static("./www", { extensions: "html" }));
app.use(bodyParser.json());

async function auth(req, res, next) {
  const authorization = req.headers["authorization"] || "";
  const jwt = authorization.split("Bearer ")[1];
  if (jwt) {
    const user = await verifyJwt(jwt);
    if (user) {
      req.user = user;
      next();
      return;
    }
  }

  res.status(401);
  res.end("Access denied");
}

app.post("/api/login", async (req, res) => {
  const username = req.body?.username;
  const password = req.body?.pwd;
  if (!username || !password) {
    res.status(400);
    res.end("Missing required parameters");
    return;
  }

  const user = await getUser(username, password);
  if (!user) {
    res.status(401);
    res.end();
    return;
  }

  const jwt = generateJwt(user);
  res.end(
    JSON.stringify({
      jwt,
    })
  );
});

app.get("/api/secrets", auth, async (req, res) => {
  const userSecrets = await getSecrets(req.user.id);
  res.end(JSON.stringify(userSecrets));
});

app.post("/api/add-secret", auth, async (req, res) => {
  const userId = req.user.id;
  const secret = {
    name: req.body.secretNameEncrypted,
    value: req.body.secretValueEncrypted,
    description: req.body.secretDescriptionEncrypted,
  };

  const result = await addSecret(userId, secret);
  if (!result.ok) {
    res.status(500);
    res.end();
    return;
  }

  res.end();
});

app.get("/api/secret/:id", auth, async (req, res) => {
  const userId = req.user.id;
  const secretId = req.params.id;
  const secret = await getSecret(userId, secretId);
  if (!secret) {
    res.status(404);
    res.end();
    return;
  }

  res.end(JSON.stringify(secret));
});

app.patch("/api/secret/:id", auth, async (req, res) => {
  const userId = req.user.id;
  const secretId = req.params.id;
  const updateFields = {
    name: req.body.name,
    value: req.body.value,
    description: req.body.description,
  };
  const result = await updateSecret(userId, secretId, updateFields);
  if (!result.ok) {
    res.status(500);
    res.end();
    return;
  }

  res.end();
});

app.listen(3000, () => console.log("listening on port 3000..."));
