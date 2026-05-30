# Feature Specification: Sistema Fresas — Gestión de Negocio de Fresas

**Feature Branch**: `001-sistema-fresas-core`

**Created**: 2026-05-30

**Status**: Draft

**Input**: Aplicación web de gestión para un pequeño negocio de venta de fresas con crema y Nutella.
Dos roles de usuario (Cajera / Administrador), registro de ventas con flujo de 3 pasos,
inventario con recetas, cuentas por cobrar para plataformas de delivery, registro de gastos,
y dashboard operativo.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Registro de Venta Rápido (Priority: P1)

La cajera abre la pantalla de venta, selecciona producto, tamaño y canal en tres toques,
ve el precio calculado, y confirma. La venta queda registrada, el inventario se descuenta
automáticamente y la pantalla regresa limpia para el siguiente pedido en menos de 5 segundos.

**Why this priority**: Es el flujo central del negocio. Sin él no hay datos para ningún otro
módulo. Cualquier fricción aquí tiene impacto directo en ingresos y velocidad de atención.

**Independent Test**: Una cajera puede registrar 5 ventas consecutivas (productos, tamaños
y canales distintos) sin tocar ningún otro módulo, y cada venta aparece reflejada en el
historial del administrador.

**Acceptance Scenarios**:

1. **Given** la cajera está en la pantalla de venta, **When** selecciona "Fresas con Crema",
   "Mediano" y "Local" (Efectivo), **Then** el sistema muestra el precio correcto para esa
   combinación y al confirmar registra la venta y vuelve a la pantalla limpia.

2. **Given** la cajera selecciona canal "Yango", **When** confirma la venta,
   **Then** el sistema registra la venta y crea automáticamente una cuenta por cobrar
   pendiente para Yango con el monto bruto y la comisión calculada.

3. **Given** el stock de un insumo es insuficiente para completar una venta,
   **When** la cajera intenta confirmar, **Then** el sistema muestra una alerta visible
   y no permite confirmar hasta que el stock sea repuesto.

4. **Given** la cajera confirma una venta exitosa, **When** la pantalla regresa,
   **Then** todos los campos están en blanco y listos para el siguiente pedido
   (sin necesidad de recargar la página).

---

### User Story 2 — Control de Inventario con Recetas (Priority: P2)

El administrador puede ver el stock actual de cada insumo, registrar compras de insumos,
ajustar cantidades manualmente y editar las recetas de cada combinación producto+tamaño.
Cada venta descuenta automáticamente los insumos correspondientes.

**Why this priority**: Sin inventario actualizado, el negocio no sabe cuándo recomprar
insumos ni si puede atender más pedidos. Es la segunda funcionalidad más crítica.

**Independent Test**: El administrador registra una compra de 1000g de fresas, registra
una venta de "Fresas con Crema Chico" (que consume X gramos según la receta), y verifica
que el stock de fresas disminuyó exactamente X gramos.

**Acceptance Scenarios**:

1. **Given** el admin está en la sección de inventario, **When** registra una compra de
   500 unidades de Vasos Medianos, **Then** el stock de Vasos Medianos aumenta en 500.

2. **Given** una receta de "Fresas con Nutella Grande" tiene configurados sus insumos,
   **When** se confirma una venta de ese producto, **Then** el stock de cada insumo
   involucrado se descuenta según la cantidad definida en la receta.

3. **Given** el admin edita la receta de "Fresas con Crema Chico" cambiando los gramos
   de fresas de 150 a 120, **When** se confirma la siguiente venta de ese producto,
   **Then** el descuento de fresas es 120g (no 150g).

---

### User Story 3 — Cuentas por Cobrar de Plataformas Delivery (Priority: P3)

El administrador puede ver el saldo pendiente acumulado por plataforma (Yango y PedidosYa
por separado), el detalle de ventas pendientes, y registrar los pagos recibidos semanalmente.

**Why this priority**: Las plataformas retienen el dinero y lo pagan con descuento.
Sin este módulo el admin no puede hacer seguimiento de cuánto le deben ni verificar
que los pagos sean correctos.

**Independent Test**: El admin ve el saldo pendiente de Yango, registra un pago recibido
de $X, y el sistema cierra las ventas correspondientes y actualiza el saldo pendiente.

**Acceptance Scenarios**:

1. **Given** hay 10 ventas de Yango pendientes de cobro, **When** el admin navega a
   Cuentas por Cobrar → Yango, **Then** ve el saldo total pendiente y el listado de
   ventas individuales con fecha, monto bruto, comisión y neto esperado.

2. **Given** el admin registra un pago recibido de Yango por $X indicando la fecha,
   **When** confirma, **Then** el sistema marca como cobradas las ventas que suman
   hasta ese monto y el saldo pendiente se reduce en consecuencia.

---

### User Story 4 — Registro de Gastos (Priority: P4)

El administrador puede registrar gastos del negocio con fecha, descripción, monto y
categoría. Las categorías son configurables.

**Why this priority**: Necesario para calcular la utilidad estimada en el dashboard.
Sin gastos no hay rentabilidad visible.

**Independent Test**: El admin registra un gasto de "Alquiler Mayo" por $2,000 en
categoría "alquiler", y el gasto aparece en el historial y se refleja en la utilidad
del día en el dashboard.

**Acceptance Scenarios**:

1. **Given** el admin completa el formulario de gasto con fecha, descripción, monto
   y categoría, **When** guarda, **Then** el gasto aparece en el historial y se
   incluye en el cálculo de utilidad del día correspondiente.

2. **Given** el admin crea una nueva categoría "papelería", **When** registra un
   gasto, **Then** "papelería" aparece disponible en el selector de categorías.

---

### User Story 5 — Dashboard Operativo (Priority: P5)

El administrador ve en una sola pantalla: stock actual con alertas visuales de bajo
inventario, totales de ventas del día por canal, promedio de los últimos 7 días,
ingresos reales del día (solo Local), saldo pendiente de plataformas, y utilidad
estimada del día.

**Why this priority**: Es la vista de control del negocio. Puede postergarse para un
segundo sprint dado que depende de los módulos anteriores.

**Independent Test**: Con datos cargados (ventas del día, gastos, stock), el admin
abre el dashboard y todos los bloques muestran valores correctos y consistentes con
el detalle de cada módulo.

**Acceptance Scenarios**:

1. **Given** hay ventas del día en todos los canales, **When** el admin abre el
   dashboard, **Then** ve el total de ventas del día (cantidad y monto) desglosado
   por canal Local, Yango y PedidosYa.

2. **Given** el stock de "Crema" está por debajo del umbral configurado,
   **When** el admin abre el dashboard, **Then** el bloque de inventario muestra
   una alerta visual destacada para ese insumo.

3. **Given** hay ingresos locales y gastos del día registrados, **When** el admin
   ve el bloque financiero, **Then** la utilidad estimada es Ingresos Local − Gastos
   del día, mostrada claramente.

---

### Edge Cases

- ¿Qué pasa si una receta no tiene definida la cantidad de algún insumo? El sistema
  debe alertar al admin y no permitir ventas de ese producto hasta que la receta esté
  completa.
- ¿Qué pasa si el precio de una combinación canal+producto+tamaño no está configurado?
  El sistema debe bloquear la venta y mostrar mensaje de precio no configurado.
- ¿Qué pasa si el pago registrado de una plataforma es mayor al saldo pendiente?
  El sistema debe alertar la diferencia y no cerrar ventas por encima del pago real.
- ¿Qué pasa si el admin modifica una receta de un producto que ya tiene ventas pasadas?
  Las ventas históricas no se recalculan; solo las futuras usan la nueva receta.
- ¿Qué pasa si el admin intenta anular una venta de un día anterior? El sistema debe
  rechazar la operación con un mensaje claro indicando que solo se pueden anular ventas
  del día en curso.
- ¿Qué pasa si la venta a anular ya tiene su cuenta por cobrar parcialmente cobrada?
  El sistema debe alertar al admin antes de continuar.
- ¿Qué pasa si dos ventas se confirman simultáneamente y el stock restante solo alcanza
  para una? El servidor procesa las escrituras en orden de llegada; la segunda venta
  recibe el error de stock insuficiente.

---

## Clarifications

### Session 2026-05-30

- Q: ¿Pueden anularse las ventas ya confirmadas? ¿Quién puede hacerlo y bajo qué restricciones? → A: Solo el admin puede anular ventas del día en curso; el sistema revierte el inventario y cancela la cuenta por cobrar asociada.
- Q: ¿Cómo decide el sistema qué ventas cerrar al registrar un pago de plataforma? → A: Cierre automático FIFO — el sistema cierra ventas desde la más antigua hasta cubrir el monto del pago recibido.
- Q: ¿Necesita el admin exportar datos a un archivo externo? → A: Sí — exportación CSV de todos los módulos: ventas, gastos y cuentas por cobrar, filtrado por rango de fechas.
- Q: ¿Cómo recupera acceso un usuario que olvidó su contraseña? → A: El admin restablece contraseñas desde Configuración → Usuarios; sin flujo de email ni dependencias externas.
- Q: ¿Pueden cajera y admin usar el sistema simultáneamente en dispositivos distintos? → A: Sí — sesiones simultáneas permitidas; el servidor garantiza consistencia de inventario mediante escrituras serializadas.

---

## Requirements *(mandatory)*

### Functional Requirements

**Acceso y Roles**

- **FR-001**: El sistema DEBE autenticar a los usuarios con credenciales (usuario y contraseña).
- **FR-002**: El sistema DEBE tener dos roles: Cajera y Administrador, con acceso diferenciado.
- **FR-003**: La Cajera SOLO puede acceder a la pantalla de Registro de Venta.
- **FR-004**: El Administrador DEBE tener acceso a todos los módulos: ventas, inventario,
  gastos, cuentas por cobrar, dashboard y configuración.
- **FR-004a**: El Administrador DEBE poder restablecer la contraseña de cualquier usuario
  desde la sección de Configuración → Usuarios, sin requerir email ni servicio externo.

**Registro de Venta**

- **FR-005**: La cajera DEBE poder registrar una venta en 3 selecciones + 1 confirmación:
  producto → tamaño → canal (→ método de pago si es Local) → confirmar.
- **FR-006**: El sistema DEBE mostrar el precio calculado antes de que la cajera confirme.
- **FR-007**: El precio DEBE asignarse automáticamente según la combinación canal+producto+tamaño.
- **FR-008**: Al confirmar una venta en canal Yango o PedidosYa, el sistema DEBE crear
  automáticamente una cuenta por cobrar pendiente para esa plataforma.
- **FR-009**: Al confirmar una venta Local, el sistema DEBE registrar el método de pago
  (Efectivo o QR).
- **FR-010**: Al confirmar una venta, el sistema DEBE descontar automáticamente los insumos
  según la receta configurada para ese producto+tamaño.
- **FR-011**: Tras confirmar una venta, la pantalla DEBE regresar inmediatamente al estado
  inicial limpio para el siguiente pedido.
- **FR-012**: El sistema NO DEBE permitir confirmar una venta si el stock de algún insumo
  requerido es insuficiente.

**Inventario**

- **FR-013**: El administrador DEBE poder registrar ingresos de stock por insumo (compras).
- **FR-014**: El administrador DEBE poder realizar ajustes manuales de stock por insumo.
- **FR-015**: El administrador DEBE poder editar las recetas de cada combinación producto+tamaño.
- **FR-016**: El sistema DEBE alertar visualmente cuando el stock de un insumo esté por
  debajo del umbral configurado.

**Cuentas por Cobrar**

- **FR-017**: El administrador DEBE poder ver el saldo pendiente acumulado por plataforma
  (Yango y PedidosYa por separado).
- **FR-018**: El administrador DEBE poder ver el detalle de ventas pendientes de cobro por
  plataforma, incluyendo monto bruto, comisión y neto esperado.
- **FR-019**: El administrador DEBE poder registrar un pago recibido de una plataforma
  (monto y fecha) y el sistema DEBE cerrar automáticamente las ventas pendientes en orden
  FIFO (la más antigua primero) hasta agotar el monto del pago. Las ventas no completamente
  cubiertas por el pago permanecen en estado pendiente. El saldo no aplicado del pago
  (si el pago supera el total pendiente) se muestra como excedente.
- **FR-020**: La comisión por plataforma DEBE ser configurable (porcentaje).

**Gastos**

- **FR-021**: El administrador DEBE poder registrar gastos con: fecha, descripción, monto
  y categoría.
- **FR-022**: Las categorías de gastos DEBEN ser configurables (agregar/editar).

**Dashboard**

- **FR-023**: El dashboard DEBE mostrar el stock actual de cada insumo con alertas visuales.
- **FR-024**: El dashboard DEBE mostrar la proyección de cuántas ventas más se pueden
  atender con el stock actual.
- **FR-025**: El dashboard DEBE mostrar el total de ventas del día (cantidad y monto)
  desglosado por canal.
- **FR-026**: El dashboard DEBE mostrar el promedio de ventas diarias de los últimos 7 días.
- **FR-027**: El dashboard DEBE mostrar los ingresos del día (ventas Local únicamente).
- **FR-028**: El dashboard DEBE mostrar el saldo pendiente total de cobro (Yango + PedidosYa).
- **FR-029**: El dashboard DEBE mostrar la utilidad estimada del día (ingresos Local − gastos del día).

**Configuración**

- **FR-030**: El administrador DEBE poder editar la tabla de precios por canal+producto+tamaño.
- **FR-031**: El administrador DEBE poder editar las recetas (insumos y cantidades) por
  combinación producto+tamaño.
- **FR-032**: El administrador DEBE poder configurar el porcentaje de comisión por plataforma.
- **FR-033**: El administrador DEBE poder configurar el umbral de alerta de stock por insumo.

**Anulación de Ventas**

- **FR-034**: El administrador DEBE poder anular una venta registrada en el día en curso.
- **FR-035**: Al anular una venta, el sistema DEBE revertir automáticamente el descuento de
  insumos aplicado por esa venta (sumando de vuelta las cantidades al stock).
- **FR-036**: Al anular una venta delivery (Yango / PedidosYa), el sistema DEBE cancelar
  automáticamente la cuenta por cobrar asociada.
- **FR-037**: Las ventas de días anteriores NO pueden ser anuladas; la restricción es al
  día en curso únicamente.

**Exportación de Datos**

- **FR-038**: El administrador DEBE poder exportar el historial de ventas en formato CSV,
  con filtro por rango de fechas.
- **FR-039**: El administrador DEBE poder exportar el historial de gastos en formato CSV,
  con filtro por rango de fechas.
- **FR-040**: El administrador DEBE poder exportar el historial de cuentas por cobrar
  (incluyendo estado: pendiente / cobrada) en formato CSV, con filtro por rango de fechas
  y por plataforma.

### Key Entities

- **Producto**: Fresas con Crema / Fresas con Nutella. Atributos: nombre.
- **Tamaño**: Chico / Mediano / Grande. Atributo: nombre.
- **Canal**: Local / Yango / PedidosYa. Atributos: nombre, porcentaje de comisión.
- **Precio**: Combinación única canal+producto+tamaño → monto. Configurable.
- **Insumo**: Nombre, unidad de medida, stock actual, umbral de alerta.
- **Receta**: Combinación producto+tamaño → lista de (insumo, cantidad). Configurable.
- **Venta**: Fecha/hora, producto, tamaño, canal, método de pago (si Local), monto,
  estado (activa / anulada). Relacionada con descuento de inventario y cuenta por cobrar.
- **CuentaPorCobrar**: Relacionada a una venta delivery. Atributos: monto bruto,
  comisión, neto esperado, estado (pendiente / cobrada), pago asociado.
- **PagoPlataforma**: Plataforma, fecha de pago, monto recibido. Cierra cuentas por cobrar.
- **Gasto**: Fecha, descripción, monto, categoría.
- **CategoríaGasto**: Nombre. Configurable.
- **Usuario**: Nombre, credenciales, rol (Cajera / Administrador).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La cajera completa el registro de una venta en 3 selecciones + 1 confirmación,
  en menos de 15 segundos desde que abre la pantalla.
- **SC-002**: La pantalla de venta regresa al estado inicial en menos de 2 segundos tras
  confirmar, sin recarga de página.
- **SC-003**: El 100% de las ventas registradas descuenta automáticamente los insumos
  correctos según la receta activa en ese momento.
- **SC-004**: El stock de inventario refleja el estado real en tiempo real tras cada venta,
  sin necesidad de recargar la página de inventario.
- **SC-005**: El administrador puede ver el saldo pendiente total por plataforma en menos
  de 2 clics desde cualquier pantalla del sistema.
- **SC-006**: El dashboard carga con todos sus bloques completos en menos de 3 segundos
  en condiciones normales de uso (hasta 500 ventas acumuladas).
- **SC-007**: La interfaz es completamente funcional en pantallas de 390px de ancho
  (smartphones) sin desplazamiento horizontal.
- **SC-008**: El sistema previene el 100% de las ventas que dejarían algún insumo
  en stock negativo.

---

## Assumptions

- El negocio opera con una sola ubicación física. No se requieren múltiples sucursales.
- El catálogo de productos (Fresas con Crema / Fresas con Nutella) y tamaños (Chico /
  Mediano / Grande) es fijo; no se añaden productos desde la interfaz (solo a través
  de configuración directa del sistema en v1).
- Los canales de venta (Local / Yango / PedidosYa) son fijos en v1; no se pueden agregar
  nuevos canales desde la interfaz.
- La aplicación es web responsive; no se desarrolla app nativa. El uso principal es desde
  un smartphone o tablet en el punto de venta.
- No se integra con las APIs de Yango ni PedidosYa; el registro de ventas y pagos es 100%
  manual.
- No se procesan pagos reales. El campo "método de pago" (Efectivo / QR) es informativo.
- No se imprimen tickets ni se envían notificaciones externas.
- Un único servidor autohospedado es suficiente para el volumen esperado del negocio.
- Las sesiones de usuario son persistentes (no hay cierre de sesión automático por
  inactividad en v1, salvo cierre manual).
- La cajera y el admin pueden operar simultáneamente desde dispositivos distintos. El
  servidor serializa las escrituras al inventario para garantizar consistencia.
- El sistema manejará un volumen máximo estimado de ~100 ventas por día y ~500 registros
  históricos en los primeros 6 meses.
