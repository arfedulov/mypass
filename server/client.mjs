import { MongoClient } from "mongodb";

let client;

//

if (!process.env.DATABASE_URL) {
  throw Error('"DATABASE_URL" environment variable is missing');
}
const DATABASE_URL = process.env.DATABASE_URL;

const getClient = async () => {
  if (client) {
    return client;
  }

  client = new MongoClient(DATABASE_URL);
  await client.connect();

  return client;
};

export const getCollection = async (collectionName) => {
  const theClient = await getClient();

  return theClient.db("mypass").collection(collectionName);
};
