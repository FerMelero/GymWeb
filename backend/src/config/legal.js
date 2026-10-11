// =====================================================================
// Datos legales de ESTE despliegue (política de privacidad y términos de uso)
//
//   null   -> PENDIENTE: lo tienes que rellenar tú. Mientras sea null, las páginas
//             /privacidad y /terminos enseñan "[PENDIENTE: ...]" resaltado y un aviso
//             de borrador, y el servidor lo avisa por consola al arrancar.
//   false  -> No aplica: se oculta de los documentos.
//
// Si esta aplicación se ofrece a varios gimnasios, cada uno necesita su propia copia
// de este archivo: cada gimnasio es el RESPONSABLE del tratamiento de los datos de sus
// socios, y quien desarrolla y mantiene el software actúa como ENCARGADO (hace falta un
// contrato entre ambos, art. 28 del RGPD).
//
// Los textos son un BORRADOR: deben revisarlos un asesor o la herramienta Facilita RGPD
// de la AEPD antes de publicarse.
// =====================================================================

const legal = {
  // Cambia `version` cada vez que modifiques el contenido de los documentos. Se guarda en
  // cada cuenta junto a la fecha como prueba de qué texto se aceptó al registrarse.
  version: '2026-10-11',
  actualizada: '2026-10-11',

  // Responsable del tratamiento (el gimnasio / la empresa o persona que lo explota)
  responsable: {
    nombre: null,     // Razón social o nombre y apellidos
    nif: null,        // NIF / CIF
    domicilio: null,  // Dirección postal completa
    email: null,      // Email de contacto para ejercer derechos de protección de datos
    telefono: false,  // Opcional: pon un teléfono o déjalo en false
  },

  // Delegado de Protección de Datos. Para un gimnasio pequeño normalmente NO es obligatorio.
  // Si lo tienes: { nombre: '...', email: '...' }
  dpo: false,

  // Edad mínima para crear una cuenta. En España, para consentir con menos de 14 años hace
  // falta la autorización de los padres o tutores (LOPDGDD, art. 7).
  edadMinima: null,

  // Proveedores que tratan datos por cuenta del responsable (encargados del tratamiento).
  //   ubicacion: país o región donde se alojan los datos (p. ej. 'Unión Europea (Fráncfort)').
  //   garantias: SOLO si están fuera del Espacio Económico Europeo: qué garantía se aplica
  //              (p. ej. 'cláusulas contractuales tipo'). Si están en la UE/EEE, pon false.
  // Añade aquí cualquier otro proveedor que uses (correo, pagos, copias de seguridad...).
  proveedores: [
    { nombre: 'Supabase', funcion: 'Base de datos donde se guardan las cuentas y los registros de acceso', ubicacion: null, garantias: null },
    { nombre: null, funcion: 'Alojamiento del servidor de la aplicación', ubicacion: null, garantias: null },
  ],

  // Cuánto tiempo se conserva cada cosa (texto libre, p. ej. '2 años desde la baja').
  // Los datos fiscales se conservan el tiempo que exija la normativa tributaria y mercantil.
  conservacion: {
    accesos: null,           // Historial de entradas y salidas
    auditoria: null,         // Registro de auditoría de acciones sobre cuentas
    cuentasInactivas: null,  // Cuentas sin actividad
  },
};

// Lista de claves que siguen en null (pendientes de rellenar), p. ej. "responsable.nif"
function pendingKeys(value = legal, path = '') {
  if (value === null) return [path];
  if (Array.isArray(value)) return value.flatMap((v, i) => pendingKeys(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => pendingKeys(v, path ? `${path}.${k}` : k));
  }
  return [];
}

module.exports = { legal, pendingKeys };
