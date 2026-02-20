# Verificar anota.click en Google Search Console

Para que Google acepte que **anota.click** es tuyo (y deje de mostrar "El sitio no está registrado a tu nombre" en la verificación de marca/OAuth), debes verificar la propiedad del sitio en **Google Search Console**.

## Pasos

### 1. Entrar a Google Search Console

- Ve a: **https://search.google.com/search-console**
- Inicia sesión con la misma cuenta de Google que usas para el proyecto de Google Cloud (OAuth).

### 2. Añadir la propiedad (anota.click)

- Clic en **"Añadir propiedad"** (o "Agregar propiedad").
- Elige **"Prefijo de URL"**.
- Escribe: `https://anota.click`
- Clic en **Continuar**.

### 3. Método de verificación: etiqueta HTML

- En la lista de métodos, elige **"Etiqueta HTML"**.
- Google te mostrará algo como:
  ```html
  <meta name="google-site-verification" content="abc123XYZ_tu_codigo_largo" />
  ```
- Copia **solo el valor de `content`** (el código que va entre comillas).

### 4. Poner el código en tu proyecto

- En **AnotaWEB**, abre `index.html`.
- Busca la línea:
  ```html
  <meta name="google-site-verification" content="TU_CODIGO_GOOGLE_SEARCH_CONSOLE" />
  ```
- Sustituye `TU_CODIGO_GOOGLE_SEARCH_CONSOLE` por el código que te dio Google (el valor de `content`).
- Guarda, haz commit y **vuelve a desplegar** el front en anota.click.

### 5. Comprobar en Search Console

- Vuelve a Search Console y haz clic en **"Comprobar"**.
- Cuando diga "Propiedad verificada", ya está.

### 6. Volver a la verificación de Google (OAuth / marca)

- Entra de nuevo en **Google Cloud Console** → tu proyecto → **APIs y servicios** → **Pantalla de consentimiento de OAuth** (o el flujo de verificación de marca).
- Vuelve a enviar o a solicitar la verificación; el error de "sitio no registrado a tu nombre" debería desaparecer una vez Search Console tenga la propiedad verificada.

---

## Si prefieres verificar por DNS

En lugar de la etiqueta HTML, puedes elegir **"Registro DNS"** en Search Console. Te darán un registro TXT que debes añadir en el panel de tu proveedor de dominio (donde gestionas anota.click). No hace falta tocar `index.html` en ese caso.
