const jwt = require("jsonwebtoken");
const secretKey = "tu_clave_secreta"; 

function verificarToken(req, res, next) {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ success: false, message: "Token requerido" });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], secretKey);
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Token inválido" });
  }
}

module.exports = verificarToken;
