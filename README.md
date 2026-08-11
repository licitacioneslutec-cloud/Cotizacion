# Cotización eléctrica · armado de APU

Herramienta web para armar los análisis de precios unitarios de un proyecto a partir
del anexo de cantidades que envía el cliente.

Es una aplicación estática: HTML, CSS y JavaScript. No hay compilación, no hay
dependencias que instalar y no hay servidor propio. Se puede colgar de un sitio
existente en Netlify copiando una carpeta.

---

## Qué hace hoy

**Proyectos**

- Lista de proyectos, con creación y borrado
- Carga del anexo del cliente en `.xlsx` o `.xlsm`, en el formato que venga
- Detección automática de la fila de encabezado y de las columnas
- Separación de capítulos e ítems: un ítem tiene unidad y cantidad, un capítulo no
- Tablero de armado: asignar apartados a cada ítem y darle su número de análisis
- Unir varios ítems bajo un mismo análisis cuando se resuelven igual
- Consideraciones por proyecto y por análisis
- Márgenes editables con recálculo del valor total
- Exportar el armado a Excel y respaldar el proyecto completo en JSON

**Catálogo de insumos** (compartido por todos los proyectos)

- Carga del archivo de datos maestros; busca sola la hoja que tenga código y precio
- Cobertura a la vista: cuántos insumos tienen precio y cuántos no
- Buscador por código o descripción, con filtro de los que están sin precio
- Actualización por tandas: se sube la lista de un proveedor y solo se tocan
  los códigos que vengan en ella
- Antes de aplicar se ve qué sube, qué baja, qué estrena precio y qué códigos
  del archivo no existen en el catálogo
- Se guarda el precio anterior, el proveedor y la fecha de cada cambio
- Historial de las últimas actualizaciones
- Descarga del catálogo actualizado en Excel

## Qué todavía no hace

- No compone los insumos de cada análisis. Ese es el motor que hoy vive en el
  ejecutable de Python y hay que portarlo.
- No trae catálogo de insumos ni precios, así que el costo directo se escribe a mano.
- No genera la cotización valorizada, la hoja de análisis ni la carta.
- No hay usuarios ni permisos.

## Dónde se guardan los datos

En el navegador del equipo donde se use, con `localStorage`. Esto significa:

- Los proyectos **no se comparten** entre personas ni entre equipos.
- Si se borran los datos del sitio en el navegador, **los proyectos se pierden**.
- Para pasar un proyecto a otra máquina se usa *Descargar respaldo* y luego
  *Importar respaldo*.

Es una limitación consciente de esta primera versión. Un backend con base de datos
compartida es el siguiente paso, y ahí desaparece.

---

## Publicar en GitHub

Desde la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Primera versión del armado de APU"
git branch -M main
git remote add origin https://github.com/USUARIO/REPOSITORIO.git
git push -u origin main
```

## Colgarlo del sitio de Netlify que ya existe

La idea es que quede en `https://tu-sitio.netlify.app/apu/` sin tocar nada de lo
que ya está publicado. Dónde copiar la carpeta `apu/` depende de cómo esté
configurado el sitio actual:

**Si el sitio no tiene proceso de compilación**
(en Netlify, *Site configuration → Build & deploy*, el campo *Publish directory*
está vacío o dice `/`)

Copia la carpeta `apu/` en la raíz del repositorio del sitio, junto al `index.html`
que ya tienes. Haz commit y push. Netlify publica solo.

**Si el sitio sí compila**
(el *Publish directory* dice `dist`, `build`, `public` o similar)

Copia la carpeta `apu/` **dentro** de esa carpeta de salida si se versiona, o dentro
de la carpeta de archivos estáticos que tu herramienta copia tal cual —en Vite es
`public/`, en Next.js también `public/`. Así queda igualmente en `/apu/`.

**Si prefieres un sitio aparte**

En Netlify, *Add new site → Import an existing project*, eliges este repositorio y
dejas el *Publish directory* en blanco. Queda en su propio dominio.

### Comprobar que quedó bien

Abre `/apu/` en el navegador. Si ves la lista de proyectos vacía, está funcionando.
Si ves un 404, la carpeta no quedó dentro del directorio que Netlify publica.

---

## Probarlo en tu equipo antes de publicar

No basta con abrir `index.html` haciendo doble clic: el navegador bloquea la lectura
de archivos locales. Hace falta un servidor, y cualquiera sirve:

```bash
cd apu
python3 -m http.server 8000
```

Luego abre `http://localhost:8000`.

---

## Estructura

```
apu/
├── index.html    Punto de entrada
├── styles.css    Estilos
└── app.js        Lectura del Excel, armado y almacenamiento
```

La lectura de archivos Excel usa SheetJS desde CDN. Es la única dependencia externa.

---

## Cómo se lee el anexo del cliente

Los anexos cambian de formato entre clientes, así que la lectura no asume posiciones
fijas. Busca la primera fila que contenga tres o más de estos conceptos: ítem,
descripción, unidad, cantidad, valor unitario, valor total. Compara sin tildes, sin
espacios y sin signos, de modo que `D E S C R I P C I Ó N`, `DESCRIPCION` y
`Descripción de actividad` se reconocen igual.

A partir de ahí, cada fila con unidad y cantidad es un ítem; las demás son capítulos.
Las filas de notas se descartan.

Los códigos de ítem se leen como texto. Excel a veces guarda `3.34` como
`3.3399999999999928`; la aplicación lo corrige al leer.
