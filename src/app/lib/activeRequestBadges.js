/**
 * Client-side SLA / task badges aligned with backend ActiveContractDisplay rules.
 * Used when the API omits fields or returns misleading defaults (e.g. On Track while overdue).
 */

function hoursUntilDeadline(deadlineIso) {
  if (!deadlineIso) return null;
  const d = new Date(deadlineIso);
  if (Number.isNaN(d.getTime())) return null;
  return (d.getTime() - Date.now()) / (1000 * 60 * 60);
}

/**
 * @param {object} request — normalized active row (camelCase)
 * @returns {{ taskState: string, slaLabel: string }}
 */
export function resolveActiveRequestBadges(request) {
  const apiTask = (request.taskState && String(request.taskState).trim()) || '';
  const apiSla = (request.slaLabel && String(request.slaLabel).trim()) || '';

  const hoursLeft = hoursUntilDeadline(request.deadline);
  if (hoursLeft === null) {
    return {
      taskState: apiTask || 'In Progress',
      slaLabel: apiSla || 'On Track',
    };
  }

  if (apiSla === 'Blocked') {
    return { taskState: apiTask || 'Delayed', slaLabel: 'Blocked' };
  }

  if (apiSla === 'Delayed') {
    return { taskState: apiTask || 'Delayed', slaLabel: 'Delayed' };
  }

  if (apiSla === 'Breached' || apiTask === 'Breached') {
    return { taskState: apiTask || 'Breached', slaLabel: 'Breached' };
  }

  if (hoursLeft <= 0) {
    return { taskState: 'Delayed', slaLabel: 'Delayed' };
  }

  if (hoursLeft <= 48) {
    return {
      taskState: apiTask === 'In Progress' || !apiTask ? 'Breached' : apiTask,
      slaLabel: 'Breached',
    };
  }

  return {
    taskState: apiTask || 'In Progress',
    slaLabel: apiSla || 'On Track',
  };
}

/** Fallback remaining text when API does not send remainingTimeDisplay (matches server wording roughly). */
export function formatRemainingDisplayForUi(deadlineIso) {
  const hoursLeft = hoursUntilDeadline(deadlineIso);
  if (hoursLeft === null) return '-';

  if (hoursLeft <= 0) {
    const overdueH = -hoursLeft;
    if (overdueH < 24) {
      const h = Math.max(1, Math.ceil(overdueH));
      return h === 1 ? 'Overdue by 1 hour' : `Overdue by ${h} hours`;
    }
    const days = Math.max(1, Math.ceil(overdueH / 24));
    return days === 1 ? 'Overdue by 1 day' : `Overdue by ${days} days`;
  }

  if (hoursLeft < 48) {
    const h = Math.max(1, Math.ceil(hoursLeft));
    return h === 1 ? '1 hour left' : `${h} hours left`;
  }

  const daysLeft = Math.max(1, Math.ceil(hoursLeft / 24));
  return daysLeft === 1 ? '1 day left' : `${daysLeft} days left`;
}

/**
 * Single SLA status line for modals (View SLA) — reconciles raw API status with deadline.
 */
export function resolveSlaDialogStatus(sla) {
  if (!sla || typeof sla !== 'object') return '-';
  let api = (sla.slaStatus && String(sla.slaStatus).trim()) || '';
  const compact = api.replace(/\s+/g, '').toLowerCase();
  if (compact === 'inprogress') api = 'In Progress';

  if (compact === 'blocked' || api === 'Blocked') return 'Blocked';
  if (compact === 'delayed') return 'Delayed';
  if (compact === 'breached') return 'Breached';

  const hoursLeft = hoursUntilDeadline(sla.deadline);
  if (hoursLeft === null) return api || '-';

  if (hoursLeft <= 0) return 'Delayed';
  if (hoursLeft <= 48) {
    if (compact === 'ontrack' || api === '' || compact === 'inprogress') return 'Breached';
    return api || 'Breached';
  }
  if (compact === 'inprogress' || api === '') return 'On Track';
  return api || 'On Track';
}
