// Archivo: Code.gs (COMPLETO Y ACTUALIZADO)

const SPREADSHEET_ID = '1sm0oVCaj7dyfDSnbX97NSxo4BjxJtqp8LrwYdGHwrd0'; // ⚠️ ¡Recuerda poner tu ID aquí!

// En Code.gs
const SCHEMA = {
  accounts:     { sheetName: 'Cuentas',       columns: ['ID', 'Nombre', 'Tipo', 'SaldoInicial'] },
  categories:   { sheetName: 'Categorias',    columns: ['ID', 'Nombre', 'Tipo', 'Presupuesto', 'Subtipo'] },
  transactions: { sheetName: 'Transacciones', columns: ['ID', 'Fecha', 'Descripcion', 'Monto', 'CuentaID', 'Categoria', 'Tipo'] },
  goals:        { sheetName: 'Metas',         columns: ['ID', 'Nombre', 'MontoObjetivo', 'MontoActual', 'CuentaAsociadaID'] },
  debts:        { sheetName: 'Deudas',        columns: ['ID', 'Nombre', 'MontoTotal', 'MontoPagado'] }
};

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('Finanzas Personales').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getInitialData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const data = {};
  let errorMessages = [];
  for (const key in SCHEMA) {
    const sheetName = SCHEMA[key].sheetName;
    try {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) throw new Error(`La hoja '${sheetName}' no fue encontrada.`);
      data[key] = sheetToObjects(sheet, SCHEMA[key].columns, key);
    } catch (error) {
      errorMessages.push(`No se cargaron datos de '${sheetName}'. Error: ${error.message}`);
      data[key] = [];
    }
  }
  if (errorMessages.length > 0) data.initializationError = errorMessages.join(' | ');
  return data;
}

function sheetToObjects(sheet, headers, entityKey) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  
  return data.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      let value = row[i];
      if (entityKey === 'transactions' && header === 'Fecha' && value instanceof Date) {
        value = value.toISOString();
      }
      obj[header] = value;
    });
    return obj;
  });
}

function addRow(entity, item) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const config = SCHEMA[entity];
  const sheet = ss.getSheetByName(config.sheetName);
  const newRow = config.columns.map(colName => item[colName] || '');
  sheet.appendRow(newRow);
  if (item.Fecha && typeof item.Fecha.toISOString === 'function') {
    item.Fecha = item.Fecha.toISOString();
  }
  return { success: true, item: item };
}

function deleteRowById(entity, id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const config = SCHEMA[entity];
  const sheet = ss.getSheetByName(config.sheetName);
  const textFinder = sheet.getRange("A:A").createTextFinder(id).matchEntireCell(true).findNext();
  if (textFinder) {
    sheet.deleteRow(textFinder.getRow());
    return { success: true, id: id };
  }
  return { success: false, message: 'ID no encontrado' };
}

function updateItem(entity, id, updates) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const config = SCHEMA[entity];
  const sheet = ss.getSheetByName(config.sheetName);
  const textFinder = sheet.getRange("A:A").createTextFinder(id).matchEntireCell(true).findNext();
  if (textFinder) {
    const row = textFinder.getRow();
    for (const key in updates) {
      const colIndex = config.columns.indexOf(key) + 1;
      if (colIndex > 0) sheet.getRange(row, colIndex).setValue(updates[key]);
    }
    return { success: true, id: id, updates: updates };
  }
  return { success: false, message: 'ID no encontrado' };
}



function addContribution(contributionData) {
  try {
    const { goalId, sourceAccountId, amount, fecha, description, goalName } = contributionData;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 1. Encontrar la meta y su cuenta de destino asociada
    const goalsSheet = ss.getSheetByName(SCHEMA.goals.sheetName);
    const goalFinder = goalsSheet.getRange("A:A").createTextFinder(goalId).matchEntireCell(true).findNext();
    if (!goalFinder) return { success: false, message: 'Meta no encontrada.' };
    
    const goalRow = goalFinder.getRow();
    const cuentaAsociadaCol = SCHEMA.goals.columns.indexOf('CuentaAsociadaID') + 1;
    const destinationAccountId = goalsSheet.getRange(goalRow, cuentaAsociadaCol).getValue();

    if (!destinationAccountId) return { success: false, message: 'La meta no tiene una cuenta asociada para recibir el aporte.' };
    if (sourceAccountId === destinationAccountId) return { success: false, message: 'La cuenta de origen y destino no pueden ser la misma.' };

    const transactionDate = new Date(fecha.replace(/-/g, '/'));
    const baseId = new Date().getTime();

    // 2. Crear la transacción de GASTO (Transferencia Saliente)
    const gasto = {
      ID: `TRN-${baseId}-G`,
      Fecha: transactionDate,
      Descripcion: description || `Aporte a: ${goalName}`,
      Monto: amount,
      CuentaID: sourceAccountId,
      Categoria: 'Transferencia Saliente',
      Tipo: 'gasto'
    };
    addRow('transactions', gasto);

    // 3. Crear la transacción de INGRESO (Transferencia Entrante)
    const ingreso = {
      ID: `TRN-${baseId}-I`,
      Fecha: transactionDate,
      Descripcion: description || `Aporte desde cuenta`,
      Monto: amount,
      CuentaID: destinationAccountId,
      Categoria: 'Transferencia Entrante',
      Tipo: 'ingreso'
    };
    addRow('transactions', ingreso);

    // 4. Actualizar el MontoActual de la meta
    const montoActualCol = SCHEMA.goals.columns.indexOf('MontoActual') + 1;
    const currentAmount = goalsSheet.getRange(goalRow, montoActualCol).getValue();
    const newAmount = (Number(currentAmount) || 0) + Number(amount);
    goalsSheet.getRange(goalRow, montoActualCol).setValue(newAmount);
    
    return { 
      success: true, 
      transactions: [gasto, ingreso], 
      updatedGoal: { id: goalId, newAmount: newAmount } 
    };

  } catch(e) {
    return { success: false, message: `Error en el servidor: ${e.message}` };
  }
}

function addTransaction(transaction) {
  transaction.ID = 'TRN-' + new Date().getTime();
  if (!transaction.Fecha || isNaN(new Date(transaction.Fecha).getTime())) {
    transaction.Fecha = new Date();
  } else {
    const fechaLocal = transaction.Fecha.replace(/-/g, '/');
    transaction.Fecha = new Date(fechaLocal);
  }
  return addRow('transactions', transaction);
}

function deleteTransaction(id) { return deleteRowById('transactions', id); }
function addAccount(account) { account.ID = 'ACC-' + new Date().getTime(); return addRow('accounts', account); }
function deleteAccount(id) { return deleteRowById('accounts', id); }
function addCategory(category) { category.ID = 'CAT-' + new Date().getTime(); return addRow('categories', category); }
function deleteCategory(id) { return deleteRowById('categories', id); }

// --- CAMBIO CLAVE: 'addGoal' ahora guarda 'CuentaAsociadaID' ---
function addGoal(goal) { 
  goal.ID = 'GOL-' + new Date().getTime(); 
  goal.MontoActual = goal.MontoActual || 0;
  // Aseguramos que el campo exista, aunque sea vacío
  goal.CuentaAsociadaID = goal.CuentaAsociadaID || ''; 
  return addRow('goals', goal); 
}

// En Code.gs
function addDebtPayment(paymentData) {
  try {
    const { debtId, sourceAccountId, amount, fecha, description, debtName } = paymentData;

    // 1. Crear la transacción de 'gasto' desde la cuenta de origen
    const transaction = {
      ID: 'TRN-PAY-' + new Date().getTime(),
      Fecha: new Date(fecha.replace(/-/g, '/')),
      Descripcion: description || `Pago de deuda: ${debtName}`,
      Monto: amount,
      CuentaID: sourceAccountId,
      Categoria: 'Pago de Deuda',
      Tipo: 'gasto'
    };
    addRow('transactions', transaction);

    // 2. Actualizar el MontoPagado de la deuda
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const debtsSheet = ss.getSheetByName(SCHEMA.debts.sheetName);
    const textFinder = debtsSheet.getRange("A:A").createTextFinder(debtId).matchEntireCell(true).findNext();

    if (textFinder) {
      const row = textFinder.getRow();
      const montoPagadoCol = SCHEMA.debts.columns.indexOf('MontoPagado') + 1;
      const currentPaidAmount = debtsSheet.getRange(row, montoPagadoCol).getValue();
      const newPaidAmount = (Number(currentPaidAmount) || 0) + Number(amount);
      debtsSheet.getRange(row, montoPagadoCol).setValue(newPaidAmount);

      return { 
        success: true, 
        transaction: transaction, 
        updatedDebt: { id: debtId, newPaidAmount: newPaidAmount } 
      };
    } else {
      return { success: false, message: 'Deuda no encontrada para actualizar.' };
    }
  } catch(e) {
    return { success: false, message: `Error en el servidor: ${e.message}` };
  }
}
// En Code.gs
function addDebt(debt) { 
  debt.ID = 'DEB-' + new Date().getTime(); 
  debt.MontoPagado = debt.MontoPagado || 0; // Se inicializa en 0
  return addRow('debts', debt); 
}

function deleteGoal(id) { return deleteRowById('goals', id); }

function deleteDebt(id) { return deleteRowById('debts', id); }
