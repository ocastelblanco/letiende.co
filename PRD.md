# PRD — Le Tiende · Sitio Web Oficial

> **Estado:** v1.x · En producción
> **Última actualización:** Abril 2026
> **Documentos relacionados:** [tech-specs.md](./tech-specs.md) · [README.md](./README.md)

---

## Tabla de contenidos

1. [Visión del producto](#1-visión-del-producto)
2. [Contexto y problema que resuelve](#2-contexto-y-problema-que-resuelve)
3. [Usuarios y audiencias](#3-usuarios-y-audiencias)
4. [Objetivos del producto](#4-objetivos-del-producto)
5. [Funcionalidades actuales (v1)](#5-funcionalidades-actuales-v1)
6. [Roadmap de funcionalidades futuras](#6-roadmap-de-funcionalidades-futuras)
7. [Casos de uso principales](#7-casos-de-uso-principales)
8. [Requisitos no funcionales](#8-requisitos-no-funcionales)
9. [Restricciones y decisiones de diseño](#9-restricciones-y-decisiones-de-diseño)
10. [Glosario de negocio](#10-glosario-de-negocio)

---

## 1. Visión del producto

El sitio web oficial de Le Tiende es la ventana digital del centro cultural: conecta a los visitantes con la agenda de eventos de Le Teatre, el menú del café-bar, y el catálogo de la librería. Es un sitio de presencia digital, no de e-commerce, diseñado para reflejar el carácter cultural, bohemio y contemporáneo del espacio físico.

La experiencia visual es el eje central: diseño impactante basado en *glassmorphism*, microanimaciones, soporte completo para modo oscuro y claro, y bilingüismo (español e inglés) para atender a la diversa audiencia del Parkway bogotano.

| Atributo | Descripción |
|---|---|
| Nombre del producto | letiende.co |
| Tipo | Sitio web informativo con panel administrativo |
| Público objetivo | Visitantes locales e internacionales + equipo interno |
| Idiomas | Español (principal), Inglés |
| URL de producción | https://letiende.co |
| URL de staging | https://letiende.co/dev/ |
| Repositorio | Privado · Rama principal de desarrollo: `2025` |

---

## 2. Contexto y problema que resuelve

**Le Tiende** es un centro cultural ubicado en el Parkway de Bogotá (Av. Bolivia), que reúne bajo un mismo techo una librería, un café-bar y el teatro **Le Teatre**, donde se realizan conciertos, obras de teatro, proyecciones de cine, lecturas y otros eventos culturales.

Antes del sitio web, la información del espacio estaba fragmentada:

- Los eventos se comunicaban principalmente por Instagram, sin una agenda centralizada ni integración con calendarios personales.
- El menú existía solo en papel, sin opción de consultarlo con anticipación ni en otro idioma.
- La librería no tenía ninguna vitrina digital.
- No había un canal de contacto estructurado para reservas o información.

**letiende.co resuelve esto** al centralizar toda la información relevante en un único destino digital de alta calidad visual, gestionable por el equipo de Le Tiende sin conocimientos técnicos.

---

## 3. Usuarios y audiencias

| Perfil | Descripción | Necesidades principales |
|---|---|---|
| **Visitante / cliente** | Persona interesada en eventos, comida o cultura. Puede ser bogotano habitual o turista. | Ver la agenda de eventos, guardar un evento en su calendario, consultar el menú en su idioma, encontrar el lugar fácilmente. |
| **Administrador interno** | Miembro del equipo de Le Tiende con acceso al panel. | Crear y editar eventos, subir imágenes, sincronizar con Google Calendar, actualizar el menú y la librería sin necesidad de programar. |

> El bilingüismo responde directamente al perfil del visitante internacional: turistas, residentes extranjeros y asistentes a eventos con programación internacional frecuentan el Parkway.

---

## 4. Objetivos del producto

| # | Objetivo | Métrica de éxito | Estado |
|---|---|---|---|
| O-01 | Mostrar la agenda cultural actualizada | Eventos visibles en producción dentro de las 24h siguientes a su creación en el admin | ✅ Implementado |
| O-02 | Ofrecer el menú actualizado sin intervención técnica | Cambios en Google Sheets reflejados automáticamente en el sitio | ✅ Implementado |
| O-03 | Gestión de contenido por el equipo sin desarrollador | Admin crea/edita/elimina eventos desde el panel web | ✅ Implementado |
| O-04 | Visibilidad en motores de búsqueda (SEO) | Indexación correcta con metadatos Open Graph y Server-Side Rendering | ✅ Implementado |
| O-05 | Comunicación institucional por correo electrónico | Correos a @letiende.co llegan al equipo | ✅ Implementado |
| O-06 | Catálogo de librería navegable en línea | Visitante puede buscar y explorar libros disponibles | 🔲 Pendiente |
| O-07 | Formulario de contacto y reservas | Usuario puede enviar mensajes y solicitar reservas desde el sitio | 🔲 Pendiente |
| O-08 | Presentación del espacio Le Teatre para productores | Información técnica del auditorio disponible en el sitio | 🔲 Pendiente |

---

## 5. Funcionalidades actuales (v1)

### 5.1 Página de inicio (`/inicio`)

La página de entrada es una experiencia visual de impacto: imagen de fondo de alta calidad, efecto glassmorphism en los elementos de interfaz, y llamadas a la acción hacia las secciones de Eventos y Menú.

- Carga instantánea gracias al renderizado en el servidor (SSR).
- Sin datos dinámicos: el contenido es estático y visual.
- Adaptada para móvil, tablet y escritorio.

---

### 5.2 Menú (`/menu`, `/menu/:categoria`)

El menú completo del café-bar, organizado por categorías navegables.

- **Bilingüe:** el usuario alterna entre español e inglés con el selector del encabezado; el contenido cambia instantáneamente.
- **Categorías:** cada categoría tiene su propio slug en la URL, lo que permite compartir enlaces directos (ej. `/menu/bebidas-calientes`).
- **Por ítem:** nombre, descripción, precio en COP, indicador de disponibilidad, alérgenos, opciones vegetarianas/veganas.
- **Actualización automática:** el equipo modifica el menú en Google Sheets y el cambio se refleja en el sitio sin necesidad de intervención técnica.

---

### 5.3 Eventos (`/eventos`)

Galería de los próximos eventos en Le Teatre, ordenados cronológicamente.

Cada tarjeta de evento incluye:
- Imagen o video del evento (alojado en Cloudinary).
- Título, fecha y hora, ubicación.
- Artistas o participantes.
- Precios por categoría y formas de pago disponibles (efectivo, Nequi, transferencia, tarjeta).
- Botón para agregar el evento al **Google Calendar** personal.
- Botón para descargar el archivo **.ics** (compatible con cualquier calendario).
- Links a plataformas externas según el evento: Átrapalo, WhatsApp, Instagram, TikTok, sitio web del artista.
- **Código PULEP** para eventos con boletería regulada por la Promotora Cultural.

Solo se muestran eventos futuros; los pasados se ocultan automáticamente.

---

### 5.4 Panel administrativo (`/admin`, `/admin/eventos`)

Área restringida al equipo autorizado de Le Tiende. El acceso requiere autenticación con cuenta Google (gestionada desde Firebase).

**Dashboard principal (`/admin`):**
- Menú con acceso a las secciones gestionables: Eventos, Menú (pendiente), Librería (pendiente).
- Muestra el nombre y avatar del usuario autenticado.
- Botón de cierre de sesión.

**Gestión de Eventos (`/admin/eventos`):**
- Lista completa de todos los eventos registrados.
- Crear nuevo evento: formulario completo con todos los campos del evento en español e inglés, subida de imagen a Cloudinary, precios, artistas, formas de pago, links, código PULEP.
- Editar evento existente: carga el formulario con los datos actuales.
- Eliminar evento: con confirmación antes de proceder.
- **Sincronización automática con Google Calendar:** al crear, editar o eliminar un evento, el cambio se refleja en el Google Calendar público de Le Tiende.

**Flujo de publicación de un evento:**

```
Administrador crea/edita evento en /admin/eventos
              ↓
Formulario envía datos a api.letiende.co/actualizarContenido
              ↓
API Lambda valida y guarda eventos.json en S3 (assets.letiende.co)
              ↓       ↓
         Simultáneamente sincroniza con Google Calendar
              ↓
El visitante ve el evento actualizado en /eventos (CDN)
```

---

### 5.5 Sistema de correo electrónico

Las siguientes direcciones de correo están activas y redirigen al equipo:

| Dirección | Propósito |
|---|---|
| info@letiende.co | Información general |
| eventos@letiende.co | Consultas sobre eventos |
| reservas@letiende.co | Solicitudes de reserva |
| libreria@letiende.co | Consultas de librería |

> El formulario de contacto público en el sitio está pendiente de implementación (ver [Sección 6](#6-roadmap-de-funcionalidades-futuras)).

---

## 6. Roadmap de funcionalidades futuras

> Las siguientes funcionalidades están identificadas, priorizadas y parcialmente preparadas a nivel de infraestructura, pero no están implementadas en el sitio público. Los placeholders en el panel admin marcan las próximas fases.

| Funcionalidad | Descripción | Prioridad | Infraestructura disponible |
|---|---|---|---|
| **Gestión de menú desde el admin** | Panel para editar el menú directamente desde el sitio, sin depender de Google Sheets | Alta | API Lambda (`/actualizarContenido`) lista |
| **Catálogo de librería (vista pública)** | Sección navegable con los libros disponibles en Le Tiende, con búsqueda y filtros | Alta | API Lambda (`/libros`) lista |
| **Admin de librería (CRUD)** | Panel para gestionar el catálogo de libros, con integración a Google Books y Discogs | Media | APIs Lambda (`/libros`, `/discogs`, `/coverDiscogs`) listas |
| **Formulario de contacto** | Formulario público en el sitio con validación anti-spam (reCAPTCHA) y envío por correo | Media | APIs Lambda (`/mensaje`, `/recaptcha`) listas |
| **Reservas para eventos** | Formulario de reserva con confirmación automática por correo | Media | Parcial (API de mensajería disponible) |
| **Página "Nosotros"** | Historia del espacio, equipo e identidad de Le Tiende | Baja | Sección ya en el esquema de contenido |
| **Página del auditorio (Le Teatre)** | Información técnica del espacio para productores y organizadores de eventos | Baja | Sección ya en el esquema de contenido |
| **Vitrina de vinilos (Discogs)** | Catálogo de la colección de vinilos disponible en Le Tiende | Baja | APIs Lambda (`/discogs`, `/coverDiscogs`) listas |

---

## 7. Casos de uso principales

| # | Actor | Acción | Resultado esperado |
|---|---|---|---|
| CU-01 | Visitante | Consulta el menú en inglés | Ve el menú completo traducido al inglés con precios en COP |
| CU-02 | Visitante | Quiere asistir a un evento y necesita recordarlo | Hace clic en "Agregar a Google Calendar" o descarga el .ics; el evento queda en su calendario personal |
| CU-03 | Visitante | Busca entradas para un concierto | Ve el enlace a Átrapalo o el contacto por WhatsApp directamente en la tarjeta del evento |
| CU-04 | Visitante | Llega de otro país y quiere información en inglés | Activa el modo inglés desde el selector del encabezado; toda la interfaz y el contenido cambian a inglés |
| CU-05 | Administrador | Crea un nuevo evento con imagen y precios | Llena el formulario bilingüe, sube la imagen, define precios y artistas; el evento aparece en `/eventos` y en el Google Calendar |
| CU-06 | Administrador | Modifica el horario de un evento | Edita el evento desde el panel; el cambio se refleja en el sitio y en el Google Calendar |
| CU-07 | Administrador | Cancela un evento | Lo elimina desde el panel; desaparece del sitio y del Google Calendar |
| CU-08 | Administrador | Actualiza el precio de un ítem del menú | Edita la celda correspondiente en Google Sheets; el cambio se refleja automáticamente en el sitio |
| CU-09 | Equipo | Recibe un correo de un cliente a reservas@letiende.co | El mensaje llega a la bandeja de Gmail del equipo |
| CU-10 | Visitante | Visita el sitio desde un teléfono móvil | Ve una versión completamente adaptada y funcional de todas las secciones |

---

## 8. Requisitos no funcionales

| Requisito | Descripción | Estado |
|---|---|---|
| **Rendimiento** | Carga inicial visible en menos de 3 segundos en móvil (SSR entrega HTML completo al primer request) | ✅ Implementado |
| **SEO** | Metadatos Open Graph, Twitter Card y etiquetas canónicas en todas las rutas | ✅ Implementado |
| **Bilingüismo** | Todo el contenido público disponible en español e inglés | ✅ Implementado |
| **Responsividad** | Experiencia completa en móvil, tablet y escritorio | ✅ Implementado |
| **Seguridad del admin** | Solo usuarios autorizados en Firebase pueden acceder al panel | ✅ Implementado |
| **Disponibilidad del contenido** | Imágenes y datos servidos desde CDN (Cloudinary + S3) con alta disponibilidad | ✅ Implementado |
| **Modo oscuro/claro** | El usuario elige el tema visual; la preferencia se mantiene durante la sesión | ✅ Implementado |
| **Bajo costo operativo** | Todos los servicios de infraestructura son gratuitos o de costo mínimo | ✅ Principio arquitectural |
| **Accesibilidad** | Estructura semántica básica, contraste adecuado | Parcial |

---

## 9. Restricciones y decisiones de diseño

### Filosofía de costos bajos

Todos los servicios de backend son gratuitos o de muy bajo costo: Firebase (free tier), AWS Lambda + S3 (free tier y costos mínimos), Cloudinary (free tier). Cualquier nueva funcionalidad debe respetar este principio antes de ser implementada.

### Sin base de datos propia gestionada

Los datos del sitio viven en archivos JSON en S3 o en Firestore (Firebase). No hay una base de datos relacional propia. Esta decisión reduce los costos operativos y la complejidad de mantenimiento.

### Google Sheets como fuente de verdad del contenido

La gestión del menú y otras secciones informativas se realiza desde una hoja de cálculo de Google. Esta decisión permite que el equipo no técnico actualice el contenido del sitio sin intervenir el código. El flujo es: editor modifica Sheets → Apps Script envía el JSON a la API → se guarda en S3 → el sitio lo consume.

### Glassmorphism como identidad visual

El diseño basado en *glassmorphism* (fondos semitransparentes con desenfoque, bordes sutiles, sombras difusas) no es negociable: es la identidad visual del sitio. Cualquier componente nuevo debe seguir este principio. Ver las guías en `src/tema/mixins.scss` y `src/tema/var.scss`.

### SSR obligatorio para SEO

El sitio usa Angular con Server-Side Rendering para garantizar la indexación correcta por parte de los motores de búsqueda. Las rutas no pueden convertirse a Single Page Application pura sin afectar el SEO.

---

## 10. Glosario de negocio

| Término | Definición |
|---|---|
| **Le Tiende** | El centro cultural. Nombre del espacio físico y del dominio web. |
| **Le Teatre** | El auditorio o teatro dentro de Le Tiende donde se realizan conciertos, obras y proyecciones. |
| **Parkway** | La Avenida Bolivia en Bogotá, calle peatonal del barrio La Soledad donde está ubicado Le Tiende. |
| **Admin** | Panel de administración interno accesible solo para el equipo autorizado. Requiere login con Google. |
| **CDN** | Red de distribución de contenido (*Content Delivery Network*). Los archivos estáticos se sirven desde servidores geográficamente distribuidos para mayor velocidad. |
| **PULEP** | Código de la Promotora Cultural de Colombia para identificar eventos con boletería regulada. Obligatorio para ciertos espectáculos públicos. |
| **Átrapalo** | Plataforma de venta de entradas para eventos en Colombia. Algunos eventos de Le Tiende se venden a través de esta plataforma. |
| **Google Calendar** | Servicio de calendario de Google. Le Tiende mantiene un calendario público donde aparecen todos los eventos activos. |
| **Cloudinary** | Servicio de alojamiento y distribución de imágenes y videos. Las fotos y videos de eventos se almacenan aquí. |
| **SSR** | Server-Side Rendering. Técnica de renderizado donde el servidor genera el HTML completo antes de enviarlo al navegador, mejorando la velocidad percibida y el SEO. |
| **Apps Script** | Plataforma de automatización de Google integrada en Google Sheets. Se usa para enviar el contenido actualizado a la API del sitio cuando el equipo modifica la hoja de cálculo. |
