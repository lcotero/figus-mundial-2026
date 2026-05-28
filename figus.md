# Guia y documentacion de funcionalidades: Figus Mundial 2026

Esta app sirve para administrar un album de figuritas del Mundial 2026 con una arquitectura simple: Google Sheets es la fuente confiable y el navegador guarda una copia local para arrancar rapido y tolerar cortes de conexion.

## Tematica y diseno visual

- Interfaz deportiva, limpia y de alto contraste.
- Contadores dinamicos de progreso: tengo, faltan y repetidas.
- Diseno responsive para escritorio y uso tactil en mobile.
- Grafico de progreso por seleccion/seccion.

## Album y coleccion

La cuadricula central clasifica figuritas por equipos y secciones especiales.

- Incrementar o decrementar la cantidad de cada figurita.
- Filtrar por todas, faltantes, tengo y repetidas.
- Buscar seleccion o seccion.
- Guardado inmediato en cache local para que la UI responda rapido.
- Autosave a Google Sheets cuando hay sesion activa.

## Google Sheets como base de datos

La app usa una planilla de Google Sheets por usuario.

- Al conectar Google, busca una planilla existente creada por la app.
- Si no existe, crea una planilla nueva.
- Lee la planilla como fuente confiable al iniciar y al sincronizar manualmente.
- Cada cambio se guarda localmente y luego se escribe en Sheets.
- Las figuritas faltantes se escriben como celdas vacias, no como `0`.
- Si la sesion vence, la app mantiene los datos locales y pide reconectar.

## Cache local

El cache vive en el navegador mediante `localStorage`.

- Perfil conectado.
- ID de planilla propia.
- Ultimo estado conocido del album.
- Fecha de ultima sincronizacion.
- Lista de planillas de amigos.

Un archivo `.md` puede usarse como export/import manual en el futuro, pero no como escritura automatica desde un navegador comun.

## Amigos y trueques

Ya no hay Firebase ni Firestore. Para comparar con amigos:

- Cada usuario comparte el link o ID de su Google Sheet.
- La app puede compartir tu planilla por Gmail desde la pantalla Amigos.
- La app puede buscar planillas Figus compartidas con tu cuenta de Google.
- El amigo debe dar permiso de lectura a la cuenta de Google que usa la app.
- La app guarda localmente esa planilla en la lista de amigos.
- Al comparar, lee la planilla compartida y calcula:
  - Mis repetidas que le faltan al amigo.
  - Sus repetidas que me faltan a mi.
- Permite armar y copiar una propuesta de trueque.

## Autenticacion

La app no usa Firebase Auth. Usa OAuth directo de Google para pedir permisos sobre:

- Perfil basico.
- Google Drive `drive.file`.
- Google Sheets.

Para desarrollo local se requiere configurar `VITE_GOOGLE_CLIENT_ID` con un OAuth Client ID web de Google Cloud.

## Tecnologias

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- Google OAuth directo.
- Google Drive API.
- Google Sheets API.
- Cache local con `localStorage`.
