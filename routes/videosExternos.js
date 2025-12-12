const express = require("express");
const router = express.Router();

// Obtener todos los videos externos
router.get("/", async (req, res) => {
  try {
    const response = await fetch(
      "http://monitoreo.regionhuanuco.gob.pe/api/public/v1/origen-videos"
    );

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error("Error obteniendo videos externos:", error);
    res.status(500).json({ error: "No se pudieron obtener los videos externos" });
  }
});

// Obtener un video externo por UUID
router.get("/:uuid", async (req, res) => {
  const { uuid } = req.params;

  try {
    const response = await fetch(
      `http://monitoreo.regionhuanuco.gob.pe/api/public/v1/origen-videos/${uuid}`
    );

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error("Error obteniendo video externo:", error);
    res.status(500).json({ error: "No se pudo obtener el video externo" });
  }
});

module.exports = router;
