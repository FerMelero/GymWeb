// Validación de documentos fiscales españoles (NIF, NIE y CIF) con dígito de control
const NIF_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

function validDni(v) {
  const m = /^(\d{8})([A-Z])$/.exec(v);
  return Boolean(m) && NIF_LETTERS[Number(m[1]) % 23] === m[2];
}

function validNie(v) {
  const m = /^([XYZ])(\d{7})([A-Z])$/.exec(v);
  if (!m) return false;
  const num = Number('XYZ'.indexOf(m[1]) + m[2]);
  return NIF_LETTERS[num % 23] === m[3];
}

function validCif(v) {
  const m = /^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/.exec(v);
  if (!m) return false;
  const [, org, digits, ctrl] = m;

  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const d = Number(digits[i]);
    if (i % 2 === 0) {
      const x = d * 2;
      sum += Math.floor(x / 10) + (x % 10);
    } else {
      sum += d;
    }
  }
  const control = (10 - (sum % 10)) % 10;
  const letter = 'JABCDEFGHI'[control];

  if ('PQRSNW'.includes(org)) return ctrl === letter; // control siempre letra
  if ('ABEH'.includes(org)) return ctrl === String(control); // control siempre número
  return ctrl === String(control) || ctrl === letter;
}

// Recibe el valor ya en mayúsculas y sin espacios ni guiones
const validNifCif = (v) => validDni(v) || validNie(v) || validCif(v);

module.exports = { validNifCif };
