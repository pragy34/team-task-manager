import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../api';
import { useFetch } from '../hooks/useFetch';
import { Spinner, Card, Badge, EmptyState } from '../components/ui';
import { formatDate, isOverdue, getPriorityColor, getStatusColor, getStatusLabel, getPriorityLabel } from '../utils/helpers';

function StatCard({ label, value, icon, color }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-black text-white mt-1">{value ?? '—'}</p>
        </div>
        <div className="text-2xl opacity-60">{icon}</div>
      </div>
      <div className="mt-3 h-1 rounded-full bg-gray-800">
        <div className="h-1 rounded-full w-1/2" style={{ backgroundColor: color }} />
      </div>
    </Card>
  );
}

function TaskRow({ task }) {
  const overdue = isOverdue(task.due_date, task.status);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-800/60 last:border-0">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusColor(task.status) }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{task.title}</p>
        <p className="text-xs text-gray-500">Project #{task.project_id}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge color={getPriorityColor(task.priority)}>{getPriorityLabel(task.priority)}</Badge>
        {task.due_date && (
          <span className={`text-xs ${overdue ? 'text-red-400 font-semibold' : 'text-gray-500'}`}>
            {overdue ? '⚠ ' : ''}{formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, loading: statsLoading } = useFetch(() => dashboardAPI.stats());
  const { data: myTasks, loading: tasksLoading } = useFetch(() => dashboardAPI.myTasks());
  const { data: overdueTasks } = useFetch(() => dashboardAPI.overdueTasks());

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening with your projects</p>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Projects" value={stats.total_projects} icon="◈" color="#8b5cf6" />
          <StatCard label="Total Tasks" value={stats.total_tasks} icon="✓" color="#3b82f6" />
          <StatCard label="My Tasks" value={stats.my_tasks} icon="⊞" color="#22c55e" />
          <StatCard label="Overdue" value={stats.overdue_tasks} icon="⚠" color="#ef4444" />
        </div>
      ) : null}

      {/* Status breakdown */}
      {stats && (
        <Card className="mb-8">
          <h2 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">Task Status Overview</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'todo', label: 'To Do', color: '#6b7280' },
              { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
              { key: 'done', label: 'Done', color: '#22c55e' },
            ].map(({ key, label, color }) => {
              const count = stats.tasks_by_status?.[key] || 0;
              const pct = stats.total_tasks ? Math.round((count / stats.total_tasks) * 100) : 0;
              return (
                <div key={key} className="text-center">
                  <p className="text-2xl font-black text-white">{count}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{pct}%</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Tasks */}
        <Card>
          <h2 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider flex items-center justify-between">
            <span>Assigned to Me</span>
            <span className="text-violet-400 text-lg font-black">{myTasks?.length || 0}</span>
          </h2>
          {tasksLoading ? <div className="flex justify-center py-4"><Spinner /></div>
            : !myTasks?.length ? (
              <EmptyState icon="✓" title="No tasks assigned" description="You're all caught up!" />
            ) : (
              myTasks.slice(0, 6).map(t => <TaskRow key={t.id} task={t} />)
            )}
        </Card>

        {/* Overdue */}
        <Card>
          <h2 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider flex items-center justify-between">
            <span>Overdue Tasks</span>
            {overdueTasks?.length > 0 && (
              <span className="text-red-400 text-lg font-black">{overdueTasks.length}</span>
            )}
          </h2>
          {!overdueTasks?.length ? (
            <EmptyState icon="🎉" title="No overdue tasks" description="Everything is on track!" />
          ) : (
            overdueTasks.slice(0, 6).map(t => <TaskRow key={t.id} task={t} />)
          )}
        </Card>
      </div>
    </div>
  );
}
