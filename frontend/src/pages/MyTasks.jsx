import { dashboardAPI } from '../api';
import { useFetch } from '../hooks/useFetch';
import { Card, Spinner, Badge, EmptyState, Avatar } from '../components/ui';
import { formatDate, isOverdue, getPriorityColor, getStatusColor, getStatusLabel, getPriorityLabel } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

export default function MyTasks() {
  const { data: tasks, loading } = useFetch(() => dashboardAPI.myTasks());
  const navigate = useNavigate();

  const grouped = {
    in_progress: (tasks || []).filter(t => t.status === 'in_progress'),
    todo: (tasks || []).filter(t => t.status === 'todo'),
    done: (tasks || []).filter(t => t.status === 'done'),
  };

  const overdue = (tasks || []).filter(t => isOverdue(t.due_date, t.status));

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">My Tasks</h1>
        <p className="text-gray-500 text-sm mt-1">{tasks?.length || 0} tasks assigned to you</p>
      </div>

      {!tasks?.length ? (
        <EmptyState icon="✓" title="No tasks assigned" description="You don't have any tasks yet. Ask your project admin to assign some!" />
      ) : (
        <div className="space-y-8">
          {overdue.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>⚠</span> Overdue ({overdue.length})
              </h2>
              <div className="space-y-2">
                {overdue.map(task => <TaskRow key={task.id} task={task} navigate={navigate} />)}
              </div>
            </section>
          )}

          {[
            { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
            { key: 'todo', label: 'To Do', color: '#6b7280' },
            { key: 'done', label: 'Done', color: '#22c55e' },
          ].map(({ key, label, color }) => grouped[key].length > 0 && (
            <section key={key}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                {label} ({grouped[key].length})
              </h2>
              <div className="space-y-2">
                {grouped[key].map(task => <TaskRow key={task.id} task={task} navigate={navigate} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, navigate }) {
  const overdue = isOverdue(task.due_date, task.status);
  return (
    <div
      className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-violet-500/30 cursor-pointer transition-all duration-200"
      onClick={() => navigate(`/projects/${task.project_id}`)}
    >
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusColor(task.status) }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-200">{task.title}</p>
        {task.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Badge color={getPriorityColor(task.priority)}>{getPriorityLabel(task.priority)}</Badge>
        <span className={`text-xs ${overdue ? 'text-red-400 font-semibold' : 'text-gray-500'}`}>
          {task.due_date ? (overdue ? '⚠ ' : '') + formatDate(task.due_date) : '—'}
        </span>
        <span className="text-xs text-gray-600">Project #{task.project_id}</span>
      </div>
    </div>
  );
}
