export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function isOverdue(dateStr, status) {
  if (!dateStr || status === 'done') return false;
  return new Date(dateStr) < new Date();
}

export function getPriorityColor(priority) {
  return { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }[priority] || '#6b7280';
}

export function getStatusColor(status) {
  return {
    todo: '#6b7280',
    in_progress: '#3b82f6',
    done: '#22c55e',
  }[status] || '#6b7280';
}

export function getStatusLabel(status) {
  return { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }[status] || status;
}

export function getPriorityLabel(priority) {
  return { low: 'Low', medium: 'Medium', high: 'High' }[priority] || priority;
}

export function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
