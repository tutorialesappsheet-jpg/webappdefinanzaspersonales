# 🚀 Proyecto de Finanzas Personales con Google Apps Script

Una aplicación web para la gestión de finanzas personales construida sobre Google Sheets y desplegada con Google Apps Script.

## ✨ Características Principales

* **Dashboard Interactivo**: Visualización de saldo total, ingresos, gastos y ahorros del mes.
* **Gráficos Dinámicos**: Gráfico de flujo de dinero anual y gráfico de gastos por categoría.
* **Gestión Completa (CRUD)**:
    * Transacciones
    * Cuentas (Efectivo, Banco, etc.)
    * Categorías de Ingresos y Gastos
    * Metas de Ahorro
    * Control de Deudas
* **Interfaz Moderna**: Diseño oscuro, responsivo y construido con Tailwind CSS.

## 🔧 Instalación y Configuración

Para desplegar tu propia versión de esta aplicación, sigue estos pasos:

1.  **Crear la Hoja de Cálculo**: Crea una nueva Hoja de Cálculo de Google (Google Sheet).
2.  **Crear las Pestañas**: Dentro de la hoja, crea las siguientes pestañas con estos nombres exactos:
    * `Cuentas`
    * `Categorias`
    * `Transacciones`
    * `Metas`
    * `Deudas`
3.  **Configurar las Columnas**: En la primera fila de cada pestaña, añade los siguientes encabezados:
    * **Cuentas**: `ID`, `Nombre`, `Tipo`, `SaldoInicial`
    * **Categorias**: `ID`, `Nombre`, `Tipo`, `Presupuesto`
    * **Transacciones**: `ID`, `Fecha`, `Descripcion`, `Monto`, `CuentaID`, `Categoria`, `Tipo`
    * **Metas**: `ID`, `Nombre`, `MontoObjetivo`, `MontoActual`
    * **Deudas**: `ID`, `Nombre`, `MontoTotal`, `Pagos`
4.  **Crear el Script**: Ve a `Extensiones` > `Apps Script` en tu hoja de cálculo.
5.  **Copiar el Código**: Borra el contenido por defecto y crea los 4 archivos (`Code.gs`, `Index.html`, `CSS.html`, `JavaScript.html`). Copia y pega el contenido de cada archivo que hemos trabajado.
6.  **Vincular el Script**: En el archivo `Code.gs`, busca la línea `const SPREADSHEET_ID = '...';` y pega el ID de tu hoja de cálculo. Puedes obtener el ID de la URL (es la cadena larga de texto entre `/d/` y `/edit`).
7.  **Desplegar**: Haz clic en `Implementar` > `Nueva implementación`. Elige `Aplicación web`, dale acceso a "Cualquier usuario" y haz clic en `Implementar`. ¡Usa la URL que te proporciona para acceder a la app!

## 📂 Estructura de Archivos

* `Code.gs`: Contiene toda la lógica del backend. Se encarga de la comunicación con la hoja de cálculo (leer, escribir, borrar datos).
* `Index.html`: Es la estructura principal de la aplicación web. Carga los estilos, las librerías y los otros archivos HTML.
* `CSS.html`: Contiene todos los estilos visuales de la aplicación.
* `JavaScript.html`: Contiene toda la lógica del frontend. Se encarga de la interactividad, renderizar las vistas, mostrar los modales y comunicarse con el backend en `Code.gs`.
