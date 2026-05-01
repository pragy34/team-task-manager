import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api';
import { useFetch, useAsync } from '../hooks/useFetch';
import { Button, Card, Modal, Input, Textarea, Spinner, Alert, EmptyState, Avatar } from '../components/ui';
import { formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

function ProjectCard({ project, onDelete, currentUserId }) {
  const navigate = useNavigate();
  const isOwner = project.owner_id === currentUserId;

  return (
    <Card onClick={() => navigate(`/projects/${project.id}`)} className="group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white truncate group-hover:text-violet-300 transition-colors">
              {project.name}
            </h3>
            {isOwner && (
              <span className="text-xs px-1.5 py-0.5 bg-violet-600/20 text-violet-400 rounded font-semibold flex-shrink-0">Owner</span>
            )}
          </div>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1 truncate">{project.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[project.owner, ...(project.members || [])].slice(0, 4).map((m, i) => m && (
              <div key={i} title={m.name}>
                <Avatar name={m.name} size="sm" />
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-500">{(project.members?.length || 0) + 1} members</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600">{project.task_count} tasks</span>
          {isOwner && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(project); }}
              className="text-xs text-gray-600 hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-700 mt-3">Created {formatDate(project.created_at)}</p>
    </Card>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const { data: projects, loading, error, refetch } = useFetch(() => projectsAPI.list());
  const { loading: creating, error: createError, execute } = useAsync();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const handleCreate = async () => {
    await execute(() => projectsAPI.create(form), () => {
      setShowCreate(false);
      setForm({ name: '', description: '' });
      refetch();
    });
  };

  const handleDelete = async () => {
    await execute(() => projectsAPI.delete(deleteTarget.id), () => {
      setDeleteTarget(null);
      refetch();
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">{projects?.length || 0} projects</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Project</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : error ? (
        <Alert message={error} />
      ) : !projects?.length ? (
        <EmptyState
          icon="◈"
          title="No projects yet"
          description="Create your first project to start managing tasks with your team."
          action={<Button onClick={() => setShowCreate(true)}>Create Project</Button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onDelete={setDeleteTarget} currentUserId={user?.id} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <div className="space-y-4">
          <Alert message={createError} />
          <Input
            label="Project Name *"
            placeholder="e.g. Website Redesign"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
          <Textarea
            label="Description"
            placeholder="What is this project about?"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!form.name.trim()}>
              Create Project
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Project" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Are you sure you want to delete <strong className="text-white">"{deleteTarget?.name}"</strong>?
            This will permanently delete all tasks inside it.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={creating}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
