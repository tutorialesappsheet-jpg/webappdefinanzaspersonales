const SPREADSHEET_ID = '1sm0oVCaj7dyfDSnbX97NSxo4BjxJtqp8LrwYdGHwrd0'; // ⚠️ ¡IMPORTANTE! Pega aquí el ID de tu nueva hoja de cálculo.

const SCHEMA = {
  accounts:     { sheetName: 'Cuentas',       columns: ['ID', 'Nombre', 'Tipo', 'SaldoInicial'] },
  categories:   { sheetName: 'Categorias',    columns: ['ID', 'Nombre', 'Tipo', 'Presupuesto'] },
  transactions: { sheetName: 'Transacciones', columns: ['ID', 'Fecha', 'Descripcion', 'Monto', 'CuentaID', 'Categoria', 'Tipo'] },
  goals:        { sheetName: 'Metas',         columns: ['ID', 'Nombre', 'MontoObjetivo', 'MontoActual'] },
  debts:        { sheetName: 'Deudas',        columns: ['ID', 'Nombre', 'MontoTotal', 'Pagos'] }
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
      // Pasamos el nombre de la entidad (key) a la función sheetToObjects
      data[key] = sheetToObjects(sheet, SCHEMA[key].columns, key);
    } catch (error) {
      errorMessages.push(`No se cargaron datos de '${sheetName}'. Error: ${error.message}`);
      data[key] = [];
    }
  }
  if (errorMessages.length > 0) data.initializationError = errorMessages.join(' | ');
  return data;
}

// --- VERSIÓN FINAL Y CORREGIDA DE sheetToObjects ---
function sheetToObjects(sheet, headers, entityKey) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  
  return data.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      let value = row[i];
      // Si estamos en la hoja de transacciones y la columna es "Fecha"
      if (entityKey === 'transactions' && header === 'Fecha' && value instanceof Date) {
        // Convertimos la fecha a un formato de texto seguro (ISO String)
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
function addGoal(goal) { goal.ID = 'GOL-' + new Date().getTime(); goal.MontoActual = goal.MontoActual || 0; return addRow('goals', goal); }
function deleteGoal(id) { return deleteRowById('goals', id); }
function addDebt(debt) { debt.ID = 'DEB-' + new Date().getTime(); debt.Pagos = debt.Pagos || '[]'; return addRow('debts', debt); }
function deleteDebt(id) { return deleteRowById('debts', id); }
