# Liford — UX Roadmap

13 cambios aprobados tras análisis UX (ver Liford — Análisis UX.html). Cada uno
incluye contexto, scope, criterios de aceptación y archivos esperados a tocar.

Orden sugerido (ver "Plan de ejecución" al final).

---

## Q1 — Toggle ARS/USD global  [QUICK WIN]

**Problema:** ARS y USD coexisten pero el usuario nunca ve su patrimonio total
unificado en una sola moneda.

**Solución:**
- Toggle ARS/USD en el header (al lado del nombre de usuario o en topbar).
- Estado global (Context o Zustand). Persistencia en localStorage.
- Cuando está activo, TODO monto se reconvierte usando la cotización del día
  (ya disponible vía `fetchCotizacion`).
- Mostrar la cotización usada en un tooltip pequeño junto al toggle.

**Archivos esperados:**
- `src/components/ui/CurrencyToggle.tsx` (nuevo)
- `src/lib/currency-context.tsx` (nuevo, Context provider)
- `src/lib/format.ts` (helper `formatInDisplayCurrency(amount, sourceCurrency)`)
- `src/app/(finanzas)/layout.tsx` (montar provider + toggle)
- Cards de Dashboard, Billeteras, Transacciones (consumir hook).

**Criterios de aceptación:**
- [ ] Cambio el toggle a USD y el patrimonio del dashboard se reconvierte.
- [ ] Refresh la página y mantiene la moneda elegida.
- [ ] Tooltip muestra "1 USD = $X ARS" con la cotización del día.
- [ ] Vista mobile: el toggle también es accesible.

---

## Q2 — Recurrente como badge en Transacciones  [QUICK WIN]

**Problema:** Las transacciones recurrentes viven en una página aparte
(`/recurrentes`) y no se ven mezcladas con el resto.

**Solución:** En la lista de gastos/ingresos, las transacciones generadas por
una recurrente muestran un ícono ↻ a la derecha del título. Click → modal con
detalle de la regla y opción "Saltar próxima ocurrencia / Editar regla / Pausar".

**Archivos esperados:**
- `src/components/finanzas/TransactionRow.tsx` (agregar badge)
- `src/components/finanzas/RecurrentRuleModal.tsx` (nuevo)
- Schema: agregar `recurrentRuleId` (nullable) a Transaction si no existe.

**Criterios de aceptación:**
- [ ] Toda transacción generada automáticamente muestra el ↻.
- [ ] Click en ↻ abre el modal con el resumen de la regla.
- [ ] Las acciones del modal funcionan y persisten.

---

## Q3 — Quick Add inteligente

**Problema:** El FAB pide Cuenta y Categoría como dropdowns vacíos. Cero
inferencia. Captura tarda ~15s para algo que debería tomar 3s.

**Solución:**
1. Input principal (descripción) primero, no monto.
2. Mientras el usuario tipea, búsqueda en el historial de transacciones del
   usuario por descripción similar (LIKE %query%, últimos 90 días, weighted by
   recency). Top match sugiere categoría + cuenta.
3. Si no hay match: caer a la cuenta más usada del último mes y pedir categoría.
4. Toggle moneda (ARS/USD/EUR) inline.
5. Botón "+ Foto recibo" (subir imagen, guardar URL en `Transaction.attachmentUrl`).
6. Atajos de teclado: ⌘+Shift+G (gasto), ⌘+Shift+I (ingreso), ⌘+Shift+T (transfer).
7. Botón "Guardar y otro" para captura batch.

**Archivos esperados:**
- `src/components/finanzas/QuickAdd.tsx` (refactor)
- `src/lib/inference/suggest-from-description.ts` (nuevo)
- `src/lib/hooks/use-keyboard-shortcuts.ts` (nuevo)
- Schema: agregar `attachmentUrl` (nullable string) a Transaction si no existe.
- API: endpoint `POST /api/transactions/suggest` que recibe descripción y
  devuelve `{ categoryId, accountId, confidence }`.

**Criterios de aceptación:**
- [ ] Tipear "Carrefour" sugiere la categoría que el usuario usó la última vez
      con esa descripción.
- [ ] Si nunca usó "Carrefour" antes, no sugiere nada (no inventa).
- [ ] ⌘+Shift+G abre el quick add con tipo Gasto preseleccionado.
- [ ] Subir foto → URL guardada en la transacción → visible en el detalle.

---

## Q4 — Transacciones unificadas

**Problema:** Gastos, Ingresos y (parcialmente) Recurrentes son páginas
separadas. Buscar "todos los gastos en Mercado Pago en marzo" es imposible.

**Solución:** Una sola página `/transacciones` que reemplaza `/gastos` y
`/ingresos`.

- Header con buscador (debounced, busca en descripción y monto).
- Chips de filtro: Tipo (Gasto/Ingreso/Transfer), Cuenta, Categoría, Rango (preset:
  Hoy / 7d / Este mes / Mes anterior / 90d / YTD / Custom).
- Strip de KPIs: Ingresos / Gastos / Balance (en la moneda activa).
- Lista agrupada por día (descendente). Sticky day headers.
- Cada fila: ícono categoría · descripción · cuenta · monto.
- `/gastos` y `/ingresos` redirigen a `/transacciones?tipo=expense` y `?tipo=income`.

**Archivos esperados:**
- `src/app/(finanzas)/finanzas/transacciones/page.tsx` (nuevo)
- `src/app/(finanzas)/finanzas/transacciones/TransactionsClient.tsx` (interactivo)
- `src/app/(finanzas)/finanzas/gastos/page.tsx` (mantener pero redirige)
- `src/app/(finanzas)/finanzas/ingresos/page.tsx` (mantener pero redirige)
- Sidebar: reemplazar "Gastos" e "Ingresos" por "Transacciones".

**Criterios de aceptación:**
- [ ] Filtros chips combinables (más de uno a la vez).
- [ ] URL refleja el estado de filtros (querystring) para compartir/bookmark.
- [ ] Búsqueda funciona en tiempo real (debounce 250ms).
- [ ] La paginación (o virtual scroll) carga >500 transacciones sin lag.

---

## Q5 — Onboarding wizard de 4 pasos

**Problema:** Después del registro, caés al dashboard vacío. Activación de día
1 brutal.

**Solución:** Ruta `/setup` que se activa la primera vez que un usuario logea
sin haber completado el wizard. Bandera `User.onboardingCompletedAt`.

Pasos:
1. **Bienvenida** — un pantallazo de qué hace Liford (3 puntos).
2. **Tus cuentas** — checkboxes con bancos populares (Mercado Pago, Galicia,
   Brubank, Efectivo, Payoneer, Wise) + opción "Otra". Crea Wallets/Accounts.
3. **Categorías** — preset (Alimentación, Transporte, Servicios, Entretenimiento,
   Salud, Suscripciones, Otro) editable. Toggle por categoría.
4. **Primer ingreso recurrente** — opcional, "¿Cobrás un sueldo mensual?
   Decinos cuándo y cuánto y lo cargamos como recurrente". Skipable.

Sidebar de progreso 4 pasos, botón Atrás, botón Skip en pasos 3 y 4.

**Archivos esperados:**
- `src/app/setup/layout.tsx` (nuevo)
- `src/app/setup/page.tsx` (nuevo, redirect a step1)
- `src/app/setup/[step]/page.tsx` (1, 2, 3, 4)
- `src/lib/auth/middleware.ts` (chequear `onboardingCompletedAt`, redirect si null)
- Schema: `User.onboardingCompletedAt` DateTime?

**Criterios de aceptación:**
- [ ] Usuario nuevo se registra → redirige a `/setup/1`.
- [ ] Saltar paso 4 marca onboarding como completo.
- [ ] Volver a logear no muestra el wizard de nuevo.
- [ ] Cuentas/categorías creadas se ven en el dashboard.

---

## Q6 — Categorías editables con ícono y color

**Problema:** Lista hardcoded sin jerarquía, sin íconos, sin colores.

**Solución:**
- CRUD de categorías en `/finanzas/categorias` (nueva subruta o dentro de
  Settings).
- Cada categoría tiene: name, icon (de un set de ~50 emojis o lucide icons),
  color (de una paleta cerrada de 12 colores), parentId (para subcategorías,
  máx 1 nivel).
- En selectores de categoría: agrupado por padre, con ícono y color.

**Archivos esperados:**
- `src/app/(finanzas)/finanzas/categorias/page.tsx` (nuevo)
- `src/components/finanzas/CategoryEditor.tsx` (nuevo)
- `src/components/finanzas/CategoryPicker.tsx` (refactor con íconos/colores)
- Schema: `Category` agregar `icon` (string, default "📁"), `color` (string,
  default "#737373"), `parentId` (nullable, FK self).

**Criterios de aceptación:**
- [ ] Crear/editar/borrar categorías funciona.
- [ ] Se puede asignar parent (subcategoría).
- [ ] El selector las muestra agrupadas con el ícono y color.
- [ ] Borrar una categoría con transacciones asociadas pide confirmación
      ("re-asignar a Otro" o cancelar).

---

## Q7 — Presupuesto multi-moneda

**Problema:** Los gastos en USD (Netflix, Spotify) no entran en presupuesto.

**Solución:**
- `Budget` agrega campo `currency` (ARS/USD).
- Al evaluar, sumar todos los gastos de la categoría convertidos a la
  moneda del presupuesto.
- Vista "Suscripciones" en presupuesto que detecta automáticamente
  recurrentes mensuales y suma el costo total proyectado del mes.

**Archivos esperados:**
- `src/app/(finanzas)/finanzas/presupuesto/BudgetManager.tsx` (refactor)
- `src/lib/finanzas/budget-calc.ts` (helper)
- Schema: `Budget.currency` (default "ARS").

**Criterios de aceptación:**
- [ ] Crear presupuesto en USD y los gastos en ARS de esa categoría se suman convertidos.
- [ ] Sección "Suscripciones recurrentes" muestra total mensual proyectado.

---

## Q8 — Metas con automatización y proyección

**Problema:** Las metas son cuentas con un nombre lindo. Sin proyección, sin
aporte automático.

**Solución:**
- Aporte automático: campo `Goal.autoContribution` (`{ amount, currency, dayOfMonth, fromAccountId }`).
  Worker mensual (cron Next.js o webhook externo) que el día N transfiere de
  fromAccount a la meta.
- Proyección: dado el progreso actual y el ritmo de aportes (manual + auto),
  calcular ETA. Mostrar "A este ritmo lo lográs el [fecha] · [N días antes/después]".
- Notificación cuando un aporte automático se hace.

**Archivos esperados:**
- `src/app/(finanzas)/finanzas/metas/GoalsManager.tsx` (refactor)
- `src/lib/finanzas/goal-projection.ts` (helper)
- `src/app/api/cron/goal-contributions/route.ts` (cron handler)
- Schema: `Goal.autoContribution` (Json o columnas separadas).

**Criterios de aceptación:**
- [ ] Configurar aporte automático y al día N se ejecuta (testeado con cron manual).
- [ ] Proyección visible en la card de la meta.
- [ ] Notificación se dispara al ejecutar el aporte.

---

## Q9 — Sesiones como Kanban

**Problema:** Pipeline de 6 estados mostrado como tabla. No se ve el estado del
mundo de un vistazo.

**Solución:**
- `/fotografia/sesiones` por defecto en vista tablero (kanban).
- Columnas: Pendiente, Confirmada, Disparada, Entregada, Pagada, Completada.
- Drag & drop entre columnas (`@dnd-kit/core`).
- Vistas alternativas: Lista (la actual) y Calendario.
- Cards con: cliente, evento, fecha, monto, alertas ("Falta cobrar", "Faltan entregar").

**Archivos esperados:**
- `src/app/(fotografia)/fotografia/sesiones/page.tsx` (refactor)
- `src/app/(fotografia)/fotografia/sesiones/KanbanBoard.tsx` (nuevo)
- `src/app/(fotografia)/fotografia/sesiones/CalendarView.tsx` (nuevo)
- Dependencia: `@dnd-kit/core` (avisame antes de instalar).

**Criterios de aceptación:**
- [ ] Drag de Pendiente → Confirmada actualiza el estado en DB.
- [ ] Switcher Tablero/Lista/Calendario funciona y la elección persiste.
- [ ] Cards con alertas visualmente destacadas.

---

## Q10 — Cliente como unidad de negocio

**Problema:** Lista plana sin LTV, sin historial, sin botón WhatsApp.

**Solución:**
- `/fotografia/clientes/[id]` con vista detalle:
  - Header: avatar (iniciales con gradient), nombre, IG, teléfono, fecha desde
    cuándo es cliente, notas.
  - Botón directo a WhatsApp (deeplink `https://wa.me/?text=Hola%20`).
  - Botón "+ Sesión" pre-pobla el form con cliente.
  - KPIs: cantidad de sesiones, total facturado, promedio por sesión, próxima sesión.
  - Historial completo de sesiones del cliente con monto y estado.

**Archivos esperados:**
- `src/app/(fotografia)/fotografia/clientes/[id]/page.tsx` (nuevo)
- `src/app/(fotografia)/fotografia/clientes/page.tsx` (cards o lista linkeable a detalle)
- `src/components/fotografia/ClientStats.tsx` (nuevo)

**Criterios de aceptación:**
- [ ] Click en cliente abre el detalle.
- [ ] Botón WhatsApp abre wa.me con el teléfono y mensaje prearmado.
- [ ] KPIs calculados correctamente desde las sesiones.

---

## Q11 — Switch Finanzas/Fotografía top-bar (desktop + mobile)

**Problema:** El switch vive en el footer del sidebar (desktop) y como icon-button
sin label en mobile. El usuario no lo encuentra.

**Solución:**
- **Desktop:** segmentado en topbar (al lado del logo o centrado): `[ Finanzas | Fotografía ]`.
  Activa el módulo. El sidebar muestra los items del módulo activo.
- **Mobile:** topbar con el segmentado completo (no IconButton). Tabbar inferior
  sigue mostrando los items del módulo activo.
- Atajo ⌘K (command palette) que permite buscar pantallas de ambos módulos
  desde cualquier lado (stretch goal, opcional).

**Archivos esperados:**
- `src/components/ui/ModuleSwitch.tsx` (nuevo)
- `src/components/ui/Sidebar.tsx` (sacar el switch del footer)
- `src/components/ui/MobileHeader.tsx` (nuevo o refactor)
- `src/app/(finanzas)/layout.tsx` y `src/app/(fotografia)/layout.tsx` (montar topbar)

**Criterios de aceptación:**
- [ ] Desktop: switch visible siempre arriba.
- [ ] Mobile: switch visible siempre arriba con label, no solo icon.
- [ ] Cambiar módulo navega a la home del módulo (e.g. `/finanzas` o `/fotografia`).

---

## Q13 — Centro de avisos

**Problema:** Cero alertas. Presupuesto excedido, recurrente que vence, sesión
del día — nada se notifica.

**Solución:**
- Campanita en topbar con badge numérico.
- Reglas (server-side, calculadas al pedir las notifs):
  - Presupuesto > 90% en la semana actual.
  - Recurrente vence en ≤ 2 días.
  - Sesión del día (estado Confirmada).
  - Meta en riesgo (proyección > targetDate).
  - Cliente que no agenda hace > 6 meses (re-engagement, opcional).
- Click → drawer con la lista. Cada notif tiene una acción ("Ver presupuesto",
  "Marcar como pagado", etc).
- Stretch: opt-in a notif por email.

**Archivos esperados:**
- `src/components/ui/NotificationCenter.tsx` (nuevo)
- `src/app/api/notifications/route.ts` (GET endpoint)
- `src/lib/notifications/rules.ts` (cada regla como función pura)

**Criterios de aceptación:**
- [ ] Badge muestra el conteo correcto.
- [ ] Cada regla genera la notif en el momento apropiado.
- [ ] Click en una notif navega o ejecuta la acción.

---

## Q15 — Vista anual y comparativas

**Problema:** Solo mes-actual. Imposible ver "mi mejor mes facturando" o
"cuánto gasté en Servicios el año pasado".

**Solución:**
- Toggle de rango en cada vista que lo amerita: Hoy / Semana / Mes / Año / YTD / Custom.
- Vista anual: gráfico de barras mes a mes (gastos vs ingresos).
- Comparativa vs período anterior: "+12% vs marzo" en KPIs.
- Página `/finanzas/anual` con resumen del año.

**Archivos esperados:**
- `src/components/ui/DateRangePicker.tsx` (nuevo o reutilizar)
- `src/app/(finanzas)/finanzas/anual/page.tsx` (nuevo)
- `src/components/finanzas/YearChart.tsx` (nuevo, con recharts o similar — avisar antes)

**Criterios de aceptación:**
- [ ] El picker es consistente en todas las páginas que lo usen.
- [ ] Vista anual carga sin lag (cachear si hace falta).
- [ ] La comparativa "+X% vs período anterior" es visible en KPIs principales.

---

## Plan de ejecución sugerido

**Bloque 1 — Quick wins (rápidos, descongestionan):**
1. Q1 — Toggle ARS/USD
2. Q2 — Recurrente como badge
3. Q11 — Switch top-bar (afecta layouts, mejor temprano)

**Bloque 2 — Refactors estructurales:**
4. Q4 — Transacciones unificadas (descongestiona /gastos /ingresos)
5. Q6 — Categorías editables (base para Q3 y Q7)
6. Q3 — Quick Add inteligente (depende de Q6)

**Bloque 3 — Features de fondo:**
7. Q5 — Onboarding (mete usuarios al fondo de Q1, Q6)
8. Q7 — Presupuesto multi-moneda (depende de Q1)
9. Q8 — Metas con automatización
10. Q15 — Vista anual

**Bloque 4 — Fotografía:**
11. Q9 — Sesiones Kanban
12. Q10 — Cliente expandido

**Bloque 5 — Cierre:**
13. Q13 — Centro de avisos (necesita todas las reglas que dependen de los puntos anteriores)

---

## Decisiones DESCARTADAS (no hacer)

- ~~Importar/Exportar/Backup separados~~ — el usuario prefiere mantenerlos juntos.
- ~~tabular-nums global~~ — fuera de scope por ahora.

---

## Convenciones para Claude Code

- Una tarea = una rama (`ux/NN-slug`) = un commit.
- Después de cada tarea: tests + lint + diff summary + esperar OK.
- Migraciones de Prisma con nombre descriptivo: `npx prisma migrate dev --name add_user_onboarding`.
- No introducir libs nuevas sin pedir confirmación (especialmente: dnd-kit, recharts).
- Mantener i18n en castellano.
- Componentes en `src/components//`. Páginas en `src/app/...`.