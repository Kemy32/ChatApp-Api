const jwt = require("jsonwebtoken");

exports.isAuth = (req, res, next) => {
  const token =
    req.cookies.token || req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "invalid token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECREAT_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(500).json({
      message: error.message,
      error: true,
    });
  }
};
