export const riskBands = [
  { level: 1, name: 'Baja', range: '1–4', note: 'Vigilar; no requiere acción inmediata.' },
  { level: 2, name: 'Menor', range: '5–8', note: 'Corregir dentro del ciclo normal de mejora.' },
  { level: 3, name: 'Moderada', range: '9–12', note: 'Plan de acción con responsable y fecha.' },
  { level: 4, name: 'Alta', range: '13–19', note: 'Priorizar en el siguiente cambio operativo.' },
  { level: 5, name: 'Crítica', range: '20–25', note: 'Acción prioritaria y seguimiento ejecutivo/técnico.' },
];

const levelFromRaw = (raw) => {
  if (raw <= 4) return 1;
  if (raw <= 8) return 2;
  if (raw <= 12) return 3;
  if (raw <= 19) return 4;
  return 5;
};

const cause = (id, label, probability, impact, evidence, action) => {
  const raw = probability * impact;
  return { id, label, probability, impact, raw, level: levelFromRaw(raw), evidence, action };
};

export const categories = [
  {
    id: 'observabilidad',
    name: 'Observabilidad',
    short: 'OBS',
    side: 'top',
    causes: [
      cause('obs-1', 'Alertas centradas en CPU; no en SLI/SLO', 4, 4, 'La alarma se activa cuando el usuario ya percibe lentitud; no existe alerta previa por latencia p95 ni tasa de errores.', 'Definir SLI de latencia, disponibilidad y error rate; crear SLO y alertas por burn-rate.'),
      cause('obs-2', 'Sin trazas distribuidas entre gateway, API y BD', 3, 4, 'Los equipos revisan cada componente por separado y tardan en identificar dónde se acumula la espera.', 'Instrumentar trazas end-to-end con correlation ID y muestreo reforzado durante picos.'),
      cause('obs-3', 'Logs sin correlación temporal uniforme', 4, 3, 'Hay diferencias de zona horaria/formato y no se reconstruye con rapidez la secuencia del incidente.', 'Normalizar timestamps, estructura JSON y correlation ID en todos los servicios.'),
    ],
  },
  {
    id: 'capacidad',
    name: 'Capacidad e infraestructura',
    short: 'CAP',
    side: 'top',
    causes: [
      cause('cap-1', 'Pool de conexiones a BD saturado', 5, 5, 'En hora pico se agotan conexiones; las solicitudes esperan y propagan timeouts a servicios dependientes.', 'Dimensionar pool con pruebas de carga, optimizar consultas y limitar concurrencia por servicio.'),
      cause('cap-2', 'Autoscaling reacciona tarde y solo por CPU', 4, 4, 'La cola de solicitudes crece antes de que CPU supere el umbral configurado.', 'Escalar por concurrencia/latencia/cola y usar capacidad mínima reforzada en ventanas críticas.'),
      cause('cap-3', 'IOPS insuficientes durante cierres y reportes', 3, 4, 'Procesos batch compiten con transacciones del portal por acceso a almacenamiento.', 'Separar cargas batch, programar ventanas y revisar límites de IOPS/throughput.'),
    ],
  },
  {
    id: 'cambios',
    name: 'Cambios y despliegues',
    short: 'CHG',
    side: 'top',
    causes: [
      cause('chg-1', 'Despliegues sin canary ni validación progresiva', 4, 5, 'Un cambio defectuoso alcanza a toda la flota antes de confirmar comportamiento con tráfico real.', 'Adoptar canary/blue-green con rollback automático basado en SLO.'),
      cause('chg-2', 'Timeouts distintos entre servicios', 4, 4, 'Gateway, API y cliente HTTP abandonan solicitudes en momentos diferentes, generando reintentos y carga adicional.', 'Estandarizar budgets de timeout y políticas de retry con jitter y límites.'),
      cause('chg-3', 'Pruebas de rendimiento no replican hora pico', 5, 5, 'Las pruebas funcionales pasan, pero no se simulan ráfagas, batch ni dependencias lentas.', 'Crear perfil de carga basado en telemetría real e incorporarlo al pipeline de release.'),
    ],
  },
  {
    id: 'personas',
    name: 'Personas y conocimiento',
    short: 'PEO',
    side: 'bottom',
    causes: [
      cause('peo-1', 'Dependencia de un único DBA', 3, 5, 'La decisión sobre bloqueo, índices o capacidad espera a una sola persona en incidentes críticos.', 'Documentar procedimientos, rotar conocimiento y entrenar al equipo on-call.'),
      cause('peo-2', 'Guardia sin tablero de contexto compartido', 3, 3, 'El primer respondedor reúne métricas manualmente y tarda en formular una hipótesis.', 'Crear un dashboard operacional único con golden signals, cambios recientes y dependencias.'),
      cause('peo-3', 'Capacidad se planifica sin calendario de demanda', 3, 4, 'Campañas y vencimientos elevan tráfico sin ajuste anticipado de recursos.', 'Integrar calendario de negocio con capacity planning y revisiones previas a eventos.'),
    ],
  },
  {
    id: 'procesos',
    name: 'Procesos operativos',
    short: 'OPS',
    side: 'bottom',
    causes: [
      cause('ops-1', 'Reinicio manual como mitigación principal', 5, 4, 'Reiniciar libera temporalmente conexiones y memoria, pero no elimina el patrón que provoca la saturación.', 'Convertir el reinicio en contingencia limitada y abrir problema con hipótesis, datos y acciones estructurales.'),
      cause('ops-2', 'RCA se cierra al desaparecer el síntoma', 5, 5, 'El incidente se marca como resuelto tras recuperar el servicio aunque no exista causa raíz validada.', 'Separar Incident Management de Problem Management y exigir acciones verificables post-incidente.'),
      cause('ops-3', 'Backlog de problemas sin propietario técnico', 4, 3, 'Hallazgos repetidos permanecen abiertos y compiten con trabajo funcional.', 'Asignar owner, fecha objetivo y revisión quincenal por criticidad.'),
    ],
  },
  {
    id: 'dependencias',
    name: 'Dependencias externas',
    short: 'EXT',
    side: 'bottom',
    causes: [
      cause('ext-1', 'Proveedor de pagos presenta latencia variable', 4, 4, 'Cuando el proveedor se degrada, los threads del portal esperan y disminuye la capacidad efectiva.', 'Aplicar timeouts estrictos, bulkheads y procesamiento asíncrono cuando el flujo lo permita.'),
      cause('ext-2', 'Identidad externa sin circuit breaker', 4, 5, 'Una dependencia lenta mantiene llamadas abiertas y amplifica la degradación en cascada.', 'Implementar circuit breaker, fallback controlado y límites de concurrencia.'),
      cause('ext-3', 'Límites del gateway no probados bajo ráfagas', 3, 4, 'No se conoce el comportamiento real ante picos de solicitudes y reintentos simultáneos.', 'Ejecutar pruebas de resiliencia y documentar cuotas, throttling y estrategia de degradación.'),
    ],
  },
];

export const allCauses = categories.flatMap((category) =>
  category.causes.map((item) => ({ ...item, category: category.name, categoryId: category.id })),
);

export const caseStudy = {
  service: 'Ventanilla Digital Regional',
  context: 'Escenario académico simulado',
  effect: 'Degradación recurrente del servicio en horas pico',
  description:
    'La plataforma permite iniciar sesión, registrar trámites, adjuntar documentos y pagar tasas. Durante campañas y fechas de vencimiento, la latencia crece de forma abrupta, aparecen timeouts y el equipo termina reiniciando componentes para recuperar el servicio.',
  facts: [
    { value: '4.8 s', label: 'latencia p95 en hora pico' },
    { value: '3', label: 'incidentes P1 en 6 semanas' },
    { value: '11', label: 'reinicios manuales registrados' },
    { value: '7.2 %', label: 'solicitudes con error en el peor pico' },
  ],
};
