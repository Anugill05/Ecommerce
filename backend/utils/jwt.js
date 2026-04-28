const jwt = require("jsonwebtoken");

const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    issuer: "flashkart",
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, { issuer: "flashkart" });
};

module.exports = { signToken, verifyToken };
