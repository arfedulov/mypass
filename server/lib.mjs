import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET;

export const getPWHash = (password) =>
  new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, function (err, hash) {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });

export const comparePasswordHash = (password, hash) =>
  new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

export const generateJwt = (data) => {
  return jsonwebtoken.sign(data, JWT_SECRET, { expiresIn: "1d" });
};

export const verifyJwt = (jwt) => {
  return new Promise((resolve) => {
    jsonwebtoken.verify(jwt, JWT_SECRET, (err, data) => {
      if (err) {
        resolve(null);
        return;
      }

      resolve(data);
    });
  });
};

export const withoutEmptyFields = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([_, val]) => val !== undefined)
  );
