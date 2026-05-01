import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../api';
import { useFetch, useAsync } from '../hooks/useFetch';
import { Button, Card, Modal, Input, Spinner, Alert, EmptyState, Badge, Avatar } from '../components/ui';
import { formatDate, isOverdue, getPriorityColor, getStatusColor, getStatusLabel, getPriorityLabel } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import TaskForm from '../components/TaskForm';

const STATUS_COLS = [
  { key: 'todo', label: 'To Do', color: '#6b7280' },
  { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { key: 'done', label: 'Done', color: '#22c55e' },
];

function TaskCard({ task, onEdit, onDelete }) {
  const overdue = isOverdue(task.due_date, task.status);
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3.5 hover:border-violet-500/30 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-200 leading-snug flex-1">{task.title}</p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit(task)} className="text-xs text-gray-500 hover:text-violet-400 px-1">✎</button>
          <button onClick={() => onDelete(task)} className="text-xs text-gray-500 hover:text-red-400 px-1">✕</button>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-3 gap-2">
        <Badge color={getPriorityColor(task.priority)}>{getPriorityLabel(task.priority)}</Badge>
        {task.due_date && (
          <span className={`text-xs ${overdue ? 'text-red-400 font-semibold' : 'text-gray-500'}`}>
            {overdue ? '⚠ ' : '📅 '}{formatDate(task.due_date)}
          </span>
        )}
      </div>

      {task.assignee && (
        <div className="flex items-center gap-1.5 mt-2.5">
          <Avatar name={task.assignee.name} size="sm" />
          <span className="text-xs text-gray-500 truncate">{task.assignee.name}</span>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: project, loading: projLoading, error: projError } = useFetch(() => projectsAPI.get(id), [id]);
  const { data: tasks, loading: tasksLoading, refetch: refetchTasks } = useFetch(() => tasksAPI.list(id), [id]);
  const { loading: submitting, error: submitError, execute } = useAsync();

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const allMembers = project ? [project.owner, ...(project.members || [])] : [];
  const isOwner = project?.owner_id === user?.id;

  const handleCreateTask = async (data) => {
    await execute(() => tasksAPI.create(id, data), () => {
      setShowTaskModal(false);
      refetchTasks();
    });
  };

  const handleUpdateTask = async (data) => {
    await execute(() => tasksAPI.update(id, editTask.id, data), () => {
      setEditTask(null);
      refetchTasks();
    });
  };

  const handleDeleteTask = async () => {
    await execute(() => tasksAPI.delete(id, deleteTask.id), () => {
      setDeleteTask(null);
      refetchTasks();
    });
  };

  const handleAddMember = async () => {
    setMemberError('');
    setAddingMember(true);
    try {
      await projectsAPI.addMember(id, { email: memberEmail, role: 'member' });
      setMemberEmail('');
      window.location.reload();
    } catch (err) {
      setMemberError(err.response?.data?.detail || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await projectsAPI.removeMember(id, memberId);
      window.location.reload();
    } catch {}
  };

  if (projLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (projError) return <div className="p-6"><Alert message={projError} /></div>;
  if (!project) return null;

  const tasksByStatus = STATUS_COLS.reduce((acc, col) => {
    acc[col.key] = (tasks || []).filter(t => t.status === col.key);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => navigate('/projects')} className="text-xs text-gray-500 hover:text-gray-300 mb-2 transition-colors">
            ← Back to Projects
          </button>
          <h1 className="text-2xl font-black text-white">{project.name}</h1>
          {project.description && <p className="text-gray-500 text-sm mt-1">{project.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowMembers(true)}>
            👥 {allMembers.length} Members
          </Button>
          <Button size="sm" onClick={() => setShowTaskModal(true)}>+ Add Task</Button>
        </div>
      </div>

      {/* Kanban columns */}
      {tasksLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {STATUS_COLS.map(col => (
            <div key={col.key} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <h2 className="text-sm font-bold text-gray-300">{col.label}</h2>
                </div>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-semibold">
                  {tasksByStatus[col.key]?.length || 0}
                </span>
              </div>

              <div className="space-y-3 min-h-20">
                {tasksByStatus[col.key]?.length === 0 ? (
                  <p className="text-xs text-gray-700 text-center py-6">No tasks here</p>
                ) : (
                  tasksByStatus[col.key].map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={t => setEditTask(t)}
                      onDelete={t => setDeleteTask(t)}
                    />
                  ))
                )}
              </div>

              <button
                onClick={() => setShowTaskModal(true)}
                className="mt-3 w-full text-xs text-gray-600 hover:text-gray-400 hover:bg-gray-800 py-2 rounded-lg transition-all text-center"
              >
                + Add task
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title="New Task" maxWidth="max-w-xl">
        <TaskForm
          members={allMembers}
          onSubmit={handleCreateTask}
          onCancel={() => setShowTaskModal(false)}
          loading={submitting}
          error={submitError}
        />
      </Modal>

      {/* Edit Task Modal */}
      <Modal open={!!editTask} onClose={() => setEditTask(null)} title="Edit Task" maxWidth="max-w-xl">
        <TaskForm
          task={editTask}
          members={allMembers}
          onSubmit={handleUpdateTask}
          onCancel={() => setEditTask(null)}
          loading={submitting}
          error={submitError}
        />
      </Modal>

      {/* Delete Task Modal */}
      <Modal open={!!deleteTask} onClose={() => setDeleteTask(null)} title="Delete Task" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Are you sure you want to delete <strong className="text-white">"{deleteTask?.title}"</strong>?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDeleteTask(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteTask} loading={submitting}>Delete</Button>
          </div>
        </div>
      </Modal>

      {/* Members Modal */}
      <Modal open={showMembers} onClose={() => setShowMembers(false)} title="Project Members">
        <div className="space-y-4">
          {isOwner && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-300">Add Member by Email</p>
              <Alert message={memberError} />
              <div className="flex gap-2">
                <Input
                  placeholder="teammate@email.com"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddMember} loading={addingMember} disabled={!memberEmail.trim()}>
                  Add
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {allMembers.map((m, i) => (
              <div key={m?.id || i} className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2.5">
                  <Avatar name={m?.name || ''} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-white">{m?.name}</p>
                    <p className="text-xs text-gray-500">{m?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m?.id === project.owner_id ? (
                    <span className="text-xs bg-violet-600/20 text-violet-400 px-2 py-0.5 rounded font-semibold">Owner</span>
                  ) : (
                    <>
                      <span className="text-xs text-gray-600">Member</span>
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="text-xs text-gray-600 hover:text-red-400 transition-colors ml-2"
                        >
                          Remove
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
