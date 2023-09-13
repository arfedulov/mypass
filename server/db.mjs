import { ObjectId } from "mongodb";
import { getCollection } from "./client.mjs";
import { withoutEmptyFields, comparePasswordHash } from "./lib.mjs";

export async function getUser(username, password) {
  const usersCollection = await getCollection("users");
  const user = await usersCollection.findOne({ name: username });
  if (!user) {
    return null;
  }
  const doesPasswordMatch = await comparePasswordHash(password, user.pwdh);
  if (!doesPasswordMatch) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
  };
}

export async function addSecret(userId, secret) {
  const secretsCollection = await getCollection("secrets");
  const opResult = await secretsCollection.insertOne({ userId, ...secret });

  return { ok: opResult.acknowledged };
}

export async function updateSecret(
  userId,
  secretId,
  { name, description, value }
) {
  const secretsCollection = await getCollection("secrets");
  const secret = await secretsCollection.findOne({
    userId,
    _id: new ObjectId(secretId),
  });
  if (!secret) {
    return { ok: false };
  }

  const $set = withoutEmptyFields({
    name,
    description,
    value,
  });
  const opResult = await secretsCollection.updateOne(
    { _id: new ObjectId(secretId) },
    { $set }
  );

  return { ok: opResult.matchedCount === 1 };
}

export async function getSecrets(userId) {
  const secretsCollection = await getCollection("secrets");
  const cursor = await secretsCollection.find({ userId });
  const secrets = await cursor.toArray();

  return secrets;
}

export async function getSecret(userId, secretId) {
  const secretsCollection = await getCollection("secrets");
  const secret = await secretsCollection.findOne({
    userId,
    _id: new ObjectId(secretId),
  });

  return secret || null;
}
