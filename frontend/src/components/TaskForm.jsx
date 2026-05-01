import { useState, useEffect } from 'react';
import { Button, Input, Textarea, Select, Alert } from './ui';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function TaskForm({ task, members = [], onSubmit, onCancel, loading, error }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? task.due_date.slice(0, 16) : '',
    assignee_id: task?.assignee_id || '',
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        due_date: task.due_date ? task.due_date.slice(0, 16) : '',
        assignee_id: task.assignee_id || '',
      });
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      assignee_id: form.assignee_id ? parseInt(form.assignee_id) : null,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />

      <Input
        label="Task Title *"
        placeholder="e.g. Design landing page"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        required
        autoFocus
      />

      <Textarea
        label="Description"
        placeholder="Describe what needs to be done..."
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
        rows={3}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Status"
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value })}
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>

        <Select
          label="Priority"
          value={form.priority}
          onChange={e => setForm({ ...form, priority: e.target.value })}
        >
          {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Due Date"
          type="datetime-local"
          value={form.due_date}
          onChange={e => setForm({ ...form, due_date: e.target.value })}
        />

        <Select
          label="Assignee"
          value={form.assignee_id}
          onChange={e => setForm({ ...form, assignee_id: e.target.value })}
        >
          <option value="">Unassigned</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </Select>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" loading={loading} disabled={!form.title.trim()}>
          {task ? 'Save Changes' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}
