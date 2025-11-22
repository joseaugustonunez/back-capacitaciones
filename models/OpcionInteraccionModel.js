const db = require('../config/db');

class OpcionInteraccion {

  static async crearVarias(idContenido, opciones) {
    if (!opciones || opciones.length === 0) {
      return [];
    }

    const query = `
      INSERT INTO opciones_interaccion (
        id_contenido_interactivo, texto_opcion, es_correcta, 
        indice_orden, explicacion
      ) VALUES ?
    `;

    const valores = opciones.map((opcion, index) => [
      idContenido,
      opcion.texto_opcion || opcion.texto,
      opcion.es_correcta ? 1 : 0,
      opcion.indice_orden !== undefined ? opcion.indice_orden : index + 1,
      opcion.explicacion || ''
    ]);

    const [result] = await db.query(query, [valores]);
    
    const ids = [];
    for (let i = 0; i < opciones.length; i++) {
      ids.push(result.insertId + i);
    }
    
    return ids;
  }


  static async crear(idContenido, opcion) {
    const {
      texto_opcion,
      es_correcta = false,
      indice_orden = 1,
      explicacion = ''
    } = opcion;

    const query = `
      INSERT INTO opciones_interaccion (
        id_contenido_interactivo, texto_opcion, es_correcta, 
        indice_orden, explicacion
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      idContenido,
      texto_opcion,
      es_correcta ? 1 : 0,
      indice_orden,
      explicacion
    ];

    const [result] = await db.execute(query, params);
    return result.insertId;
  }

  
  static async obtenerPorInteraccion(idContenido) {
    const query = `
      SELECT * FROM opciones_interaccion 
      WHERE id_contenido_interactivo = ? 
      ORDER BY indice_orden ASC
    `;

    const [rows] = await db.execute(query, [idContenido]);
    
    return rows.map(row => ({
      id: row.id,
      id_contenido_interactivo: row.id_contenido_interactivo,
      texto_opcion: row.texto_opcion,
      es_correcta: Boolean(row.es_correcta),
      indice_orden: row.indice_orden,
      explicacion: row.explicacion,
      fecha_creacion: row.fecha_creacion,
      fecha_actualizacion: row.fecha_actualizacion
    }));
  }

 
  static async obtenerPorId(id) {
    const query = 'SELECT * FROM opciones_interaccion WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      id_contenido_interactivo: row.id_contenido_interactivo,
      texto_opcion: row.texto_opcion,
      es_correcta: Boolean(row.es_correcta),
      indice_orden: row.indice_orden,
      explicacion: row.explicacion,
      fecha_creacion: row.fecha_creacion,
      fecha_actualizacion: row.fecha_actualizacion
    };
  }

 
  static async actualizar(id, datos) {
    const campos = [];
    const valores = [];
    
    Object.keys(datos).forEach(campo => {
      if (datos[campo] !== undefined) {
        campos.push(`${campo} = ?`);
        if (campo === 'es_correcta') {
          valores.push(datos[campo] ? 1 : 0);
        } else {
          valores.push(datos[campo]);
        }
      }
    });
    
    if (campos.length === 0) return false;
    
    valores.push(id);
    const query = `UPDATE opciones_interaccion SET ${campos.join(', ')} WHERE id = ?`;
    
    const [result] = await db.execute(query, valores);
    return result.affectedRows > 0;
  }

 
  static async eliminar(id) {
    const query = 'DELETE FROM opciones_interaccion WHERE id = ?';
    const [result] = await db.execute(query, [id]);
    return result.affectedRows > 0;
  }


  static async eliminarPorInteraccion(idContenido) {
    const query = 'DELETE FROM opciones_interaccion WHERE id_contenido_interactivo = ?';
    const [result] = await db.execute(query, [idContenido]);
    return result.affectedRows;
  }


  static async obtenerOpcionesCorrectas(idContenido) {
    const query = `
      SELECT * FROM opciones_interaccion 
      WHERE id_contenido_interactivo = ? AND es_correcta = 1
      ORDER BY indice_orden ASC
    `;

    const [rows] = await db.execute(query, [idContenido]);
    
    return rows.map(row => ({
      id: row.id,
      id_contenido_interactivo: row.id_contenido_interactivo,
      texto_opcion: row.texto_opcion,
      es_correcta: Boolean(row.es_correcta),
      indice_orden: row.indice_orden,
      explicacion: row.explicacion
    }));
  }

 
  static async reordenar(idContenido, nuevoOrden) {
    if (!nuevoOrden || nuevoOrden.length === 0) {
      return false;
    }

    try {
      await db.beginTransaction();

      for (let i = 0; i < nuevoOrden.length; i++) {
        const query = `
          UPDATE opciones_interaccion 
          SET indice_orden = ? 
          WHERE id = ? AND id_contenido_interactivo = ?
        `;
        await db.execute(query, [i + 1, nuevoOrden[i], idContenido]);
      }

      await db.commit();
      return true;
    } catch (error) {
      await db.rollback();
      console.error('Error al reordenar opciones:', error);
      return false;
    }
  }

 
  static async contarOpciones(idContenido) {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN es_correcta = 1 THEN 1 ELSE 0 END) as correctas
      FROM opciones_interaccion 
      WHERE id_contenido_interactivo = ?
    `;

    const [rows] = await db.execute(query, [idContenido]);
    const resultado = rows[0];

    return {
      total: resultado.total || 0,
      correctas: resultado.correctas || 0,
      incorrectas: (resultado.total || 0) - (resultado.correctas || 0)
    };
  }

  
  static async duplicar(idContenidoOrigen, idContenidoDestino) {
    const opcionesOrigen = await this.obtenerPorInteraccion(idContenidoOrigen);
    
    if (opcionesOrigen.length === 0) {
      return [];
    }

    const opcionesDuplicadas = opcionesOrigen.map(opcion => ({
      texto_opcion: opcion.texto_opcion,
      es_correcta: opcion.es_correcta,
      indice_orden: opcion.indice_orden,
      explicacion: opcion.explicacion
    }));

    return await this.crearVarias(idContenidoDestino, opcionesDuplicadas);
  }

 
 static validarOpciones(opciones, tipo_interaccion) {
    const errores = [];
    
    if (!Array.isArray(opciones) || opciones.length === 0) {
      errores.push('Las opciones deben ser un array no vacío');
      return { valido: false, errores };
    }

    let tieneCorrecta = false;
    const textosUnicos = new Set();

    opciones.forEach((opcion, index) => {
      const textoOpcion = opcion.texto_opcion || opcion.texto;
      if (!textoOpcion || typeof textoOpcion !== 'string' || textoOpcion.trim().length === 0) {
        errores.push(`Opción ${index + 1}: el texto es obligatorio`);
      } else {
        const textoNormalizado = textoOpcion.trim().toLowerCase();
        if (textosUnicos.has(textoNormalizado)) {
          errores.push(`Opción ${index + 1}: texto duplicado`);
        } else {
          textosUnicos.add(textoNormalizado);
        }
      }

      if (opcion.es_correcta) {
        tieneCorrecta = true;
      }

      if (opcion.indice_orden !== undefined && (typeof opcion.indice_orden !== 'number' || opcion.indice_orden < 1)) {
        errores.push(`Opción ${index + 1}: índice de orden debe ser un número mayor a 0`);
      }
    });

    if (tipo_interaccion !== 'votacion' && !tieneCorrecta) {
      errores.push('Debe haber al menos una opción correcta');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }
}

module.exports = OpcionInteraccion;