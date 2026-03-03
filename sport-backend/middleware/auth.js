const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    // 🔹 якщо токена нема
    if (!token) {
      return res.status(401).json({
        error: "Будь ласка, увійдіть або зареєструйтесь.",
        message: "Будь ласка, увійдіть або зареєструйтесь."
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.user = payload;
    next();

  } catch (err) {
    return res.status(401).json({
      error: "INVALID_TOKEN",
      message: "Сесія недійсна. Увійдіть повторно."
    });
  }
};