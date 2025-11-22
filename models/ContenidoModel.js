const db = require('../config/db');

class ContenidoInteractivo {

  static async obtenerPorVideo(idVideo) {
    const query = `
       SELECT ci.*, 
           ti.nombre AS tipo_nombre,
           ti.descripcion AS tipo_descripcion,
           oi.id AS opcion_id,
           oi.texto_opcion,
           oi.es_correcta AS opcion_es_correcta,
           oi.explicacion,
           oi.indice_orden AS opcion_orden
    FROM contenido_interactivo ci
    LEFT JOIN tipos_interaccion ti ON ci.id_tipo_interaccion = ti.id
    LEFT JOIN opciones_interaccion oi ON ci.id = oi.id_contenido_interactivo
    WHERE ci.id_video = ? AND ci.esta_activo = 1
    ORDER BY ci.indice_orden ASC, oi.indice_orden ASC
    `;

    const [rows] = await db.execute(query, [idVideo]);
    const interaccionesMap = new Map();

    for (const row of rows) {
      if (!interaccionesMap.has(row.id)) {
        let configObj = {};
        try {
          configObj = typeof row.configuracion === "string"
            ? JSON.parse(row.configuracion)
            : row.configuracion || {};
        } catch (e) {
          console.warn("Error al parsear configuración:", e);
        }

        interaccionesMap.set(row.id, {
          id: row.id,
          id_video: row.id_video,
          id_tipo_interaccion: row.id_tipo_interaccion,
          titulo: row.titulo,
          descripcion: row.descripcion,
          tiempo_activacion_segundos: row.tiempo_activacion_segundos,
          configuracion: configObj,
          es_obligatorio: Boolean(row.es_obligatorio),
          puntos: row.puntos,
          indice_orden: row.indice_orden,
          esta_activo: Boolean(row.esta_activo),
          fecha_creacion: row.fecha_creacion,
          fecha_actualizacion: row.fecha_actualizacion,
          opciones: []
        });
      }

      if (row.opcion_id) {
        interaccionesMap.get(row.id).opciones.push({
          id: row.opcion_id,
          texto_opcion: row.texto_opcion,
          es_correcta: Boolean(row.opcion_es_correcta),
          explicacion: row.explicacion,
          indice_orden: row.opcion_orden
        });
      }
    }

    return Array.from(interaccionesMap.values());
  }
static async obtenerPorVideoOrdenadas(idVideo) {
  try {
    const [rows] = await db.query(
      `SELECT * 
       FROM contenido_interactivo 
       WHERE id_video = ? AND esta_activo = 1
       ORDER BY tiempo_activacion_segundos ASC`,
      [idVideo]
    );
    return rows;
  } catch (error) {
    console.error("Error en obtenerPorVideoOrdenadas:", error);
    throw error;
  }
}

static async calcularTiempoRetroceso(interaccion) {
  try {
    const interaccionesVideo = await this.obtenerPorVideoOrdenadas(interaccion.id_video);

    if (!interaccionesVideo || interaccionesVideo.length === 0) {
      return 0;
    }

    const indexActual = interaccionesVideo.findIndex(i => i.id === interaccion.id);

    if (indexActual <= 0) {
      return 0;
    }

    const anterior = interaccionesVideo[indexActual - 1];

    const tiempoRetroceso = Number(anterior.tiempo_activacion_segundos) + 1;

    return tiempoRetroceso;
  } catch (error) {
    console.error("Error en calcularTiempoRetroceso:", error);
    throw error;
  }
}

static async eliminar(id) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      'DELETE FROM opciones_interaccion WHERE id_contenido_interactivo = ?',
      [id]
    );

    const [result] = await conn.execute(
      'DELETE FROM contenido_interactivo WHERE id = ?',
      [id]
    );

    await conn.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

  static async crear(datos) {
    const {
      id_video,
      id_tipo_interaccion,
      titulo,
      descripcion,
      tiempo_activacion_segundos,
      configuracion = {},
      es_obligatorio = false,
      puntos = 0,
      indice_orden = 0
    } = datos;

    const query = `
      INSERT INTO contenido_interactivo (
        id_video, id_tipo_interaccion, titulo, descripcion,
        tiempo_activacion_segundos, configuracion, es_obligatorio,
        puntos, indice_orden, esta_activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;

    const params = [
      id_video,
      id_tipo_interaccion,
      titulo,
      descripcion,
      tiempo_activacion_segundos,
      JSON.stringify(configuracion),
      es_obligatorio ? 1 : 0,
      puntos,
      indice_orden
    ];

    const [result] = await db.query(query, params);
    return result.insertId;
  }



  static async obtenerPorId(id) {
    const query = `
      SELECT ci.*, 
             oi.id as opcion_id,
             oi.texto_opcion,
             oi.es_correcta as opcion_es_correcta,
             oi.explicacion,
             oi.indice_orden as opcion_orden
      FROM contenido_interactivo ci
      LEFT JOIN opciones_interaccion oi ON ci.id = oi.id_contenido_interactivo
      WHERE ci.id = ?
      ORDER BY oi.indice_orden ASC
    `;

    const [rows] = await db.execute(query, [id]);

    if (rows.length === 0) return null;

    const interaccion = {
      id: rows[0].id,
      id_video: rows[0].id_video,
      id_tipo_interaccion: rows[0].id_tipo_interaccion,
      titulo: rows[0].titulo,
      descripcion: rows[0].descripcion,
      tiempo_activacion_segundos: rows[0].tiempo_activacion_segundos,
      configuracion: this._parseConfiguracion(rows[0].configuracion),
      es_obligatorio: Boolean(rows[0].es_obligatorio),
      puntos: rows[0].puntos,
      indice_orden: rows[0].indice_orden,
      esta_activo: Boolean(rows[0].esta_activo),
      fecha_creacion: rows[0].fecha_creacion,
      fecha_actualizacion: rows[0].fecha_actualizacion,
      opciones: []
    };

    rows.forEach(row => {
      if (row.opcion_id) {
        interaccion.opciones.push({
          id: row.opcion_id,
          texto_opcion: row.texto_opcion,
          es_correcta: Boolean(row.opcion_es_correcta),
          explicacion: row.explicacion,
          indice_orden: row.opcion_orden
        });
      }
    });

    return interaccion;
  }


static async actualizar(id, datos) {
  const campos = [];
  const valores = [];

  const columnasValidas = [
    "id_video",
    "id_tipo_interaccion",
    "titulo",
    "descripcion",
    "tiempo_activacion_segundos",
    "configuracion",
    "es_obligatorio",
    "puntos",
    "indice_orden",
    "esta_activo",
    "fecha_actualizacion"
  ];

  for (const campo of Object.keys(datos)) {
    if (columnasValidas.includes(campo) && datos[campo] !== undefined) {
      campos.push(`${campo} = ?`);

      if (campo === "fecha_actualizacion") {
        valores.push(
          new Date(datos[campo]).toISOString().slice(0, 19).replace("T", " ")
        );
      } else if (campo === "configuracion" && typeof datos[campo] === "object") {
        valores.push(JSON.stringify(datos[campo]));
      } else {
        valores.push(datos[campo]);
      }
    }
  }

  if (campos.length > 0) {
    valores.push(id);
    const query = `UPDATE contenido_interactivo SET ${campos.join(", ")} WHERE id = ?`;
    await db.execute(query, valores);
  }

  if (Array.isArray(datos.opciones)) {
    const [opcionesDB] = await db.execute(
      "SELECT id FROM opciones_interaccion WHERE id_contenido_interactivo = ?",
      [id]
    );
    const idsEnDB = opcionesDB.map(o => o.id);

    const idsEnPayload = datos.opciones.filter(o => o.id).map(o => o.id);

    const idsParaBorrar = idsEnDB.filter(dbId => !idsEnPayload.includes(dbId));
    if (idsParaBorrar.length > 0) {
      await db.execute(
        `DELETE FROM opciones_interaccion 
         WHERE id_contenido_interactivo = ? AND id IN (${idsParaBorrar.map(() => "?").join(",")})`,
        [id, ...idsParaBorrar]
      );
    }

    for (const opcion of datos.opciones) {
      if (opcion.id && idsEnDB.includes(opcion.id)) {
        await db.execute(
          `UPDATE opciones_interaccion 
           SET texto_opcion = ?, es_correcta = ?, explicacion = ?, indice_orden = ? 
           WHERE id = ? AND id_contenido_interactivo = ?`,
          [
            opcion.texto_opcion,
            opcion.es_correcta ? 1 : 0,
            opcion.explicacion || "",
            opcion.indice_orden || 0,
            opcion.id,
            id
          ]
        );
      } else {
        await db.execute(
          `INSERT INTO opciones_interaccion 
            (id_contenido_interactivo, texto_opcion, es_correcta, explicacion, indice_orden) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            id,
            opcion.texto_opcion,
            opcion.es_correcta ? 1 : 0,
            opcion.explicacion || "",
            opcion.indice_orden || 0
          ]
        );
      }
    }
  }

  return true;
}



static async desactivar(id) {
  const query = 'UPDATE contenido_interactivo SET esta_activo = 0 WHERE id = ?';
  const [result] = await db.execute(query, [id]);
  return result.affectedRows > 0;
}



  static async contarPorVideo(idVideo) {
    const query = `
      SELECT COUNT(*) AS total
      FROM contenido_interactivo
      WHERE id_video = ? AND esta_activo = 1
    `;
    const [rows] = await db.execute(query, [idVideo]);
    return rows[0].total;
  }


  static async obtenerEstadisticasPorTipo(idVideo) {
    const query = `
      SELECT ci.id_tipo_interaccion, COUNT(*) AS total
      FROM contenido_interactivo ci
      WHERE ci.id_video = ? AND ci.esta_activo = 1
      GROUP BY ci.id_tipo_interaccion
      ORDER BY ci.id_tipo_interaccion ASC
    `;
    const [rows] = await db.execute(query, [idVideo]);
    return rows;
  }


  static async obtenerObligatoriasHastaTiempo(idVideo, tiempoActual) {
    const query = `
      SELECT * FROM contenido_interactivo
      WHERE id_video = ? 
        AND es_obligatorio = 1 
        AND esta_activo = 1
        AND tiempo_activacion_segundos <= ?
      ORDER BY tiempo_activacion_segundos ASC
    `;
    const [rows] = await db.execute(query, [idVideo, tiempoActual]);
    return rows.map(row => ({
      ...row,
      configuracion: this._parseConfiguracion(row.configuracion),
      es_obligatorio: Boolean(row.es_obligatorio),
      esta_activo: Boolean(row.esta_activo)
    }));
  }

  static _parseConfiguracion(configuracion) {
    if (typeof configuracion === 'string') {
      try {
        return JSON.parse(configuracion);
      } catch (e) {
        console.warn('Error al parsear configuración:', e);
        return {};
      }
    }
    return configuracion || {};
  }
}

module.exports = ContenidoInteractivo;