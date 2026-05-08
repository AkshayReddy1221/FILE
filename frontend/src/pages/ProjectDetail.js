import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format, isPast } from 'date-fns';
 
const STATUSES = ['todo', 'in-progress', 'review', 'done'];
const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };
 
// ---- Task Modal ----
function TaskModal({ task, onClose, onSaved, projectMembers, projectId, currentUser }) {
  const isNew = !task;
  const [form, setForm] = useState(task ? {
    title: task.title || '',
    description: task.description || '',
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    assignedTo: task.assignedTo?._id || '',
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
  } : { title: '', description: '', status: 'todo', priority: 'medium', assignedTo: '', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const isAdmin = currentUser?.role === 'admin';
 
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, project: projectId };
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.dueDate) delete payload.dueDate;
 
      let saved;
      if (isNew) {
        const { data } = await api.post('/tasks', payload);
        saved = data;
        toast.success('Task created!');
      } else {
        const { data } = await api.put(`/tasks/${task._id}`, payload);
        saved = data;
        toast.success('Task updated!');
      }
      onSaved(saved, isNew);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };
 
  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success('Task deleted');
      onSaved(task, false, true);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };
 
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isNew ? '+ New Task' : 'Edit Task'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add more context..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            {isAdmin && (
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
            )}
          </div>
          {isAdmin && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-select" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {projectMembers.map(m => (
                    <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
          )}
          <div className="modal-actions">
            {!isNew && isAdmin && (
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : isNew ? 'Create Task' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
 
// ---- Add Member Modal ----
function AddMemberModal({ onClose, onAdded, projectId }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
 
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post(`/projects/${projectId}/members`, { email, role });
      onAdded(data);
      toast.success('Member added!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Add Team Member</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Member Email</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="member@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Role in Project</label>
            <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add Member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
 
// ---- Kanban Board ----
function KanbanBoard({ tasks, onTaskClick, onAddTask, isAdmin }) {
  return (
    <div className="kanban-board">
      {STATUSES.map(status => {
        const colTasks = tasks.filter(t => t.status === status);
        return (
          <div key={status} className="kanban-col">
            <div className="kanban-col-header">
              <span className="kanban-col-title">{STATUS_LABELS[status]}</span>
              <span className="kanban-count">{colTasks.length}</span>
            </div>
            {colTasks.map(task => {
              const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
              return (
                <div key={task._id} className={`task-card ${overdue ? 'overdue' : ''}`} onClick={() => onTaskClick(task)}>
                  <div className="task-card-title">{task.title}</div>
                  <div className="task-card-meta">
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    {task.assignedTo && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>👤 {task.assignedTo.name}</span>
                    )}
                    {task.dueDate && (
                      <span className={`task-card-due ${overdue ? 'overdue' : ''}`}>
                        📅 {format(new Date(task.dueDate), 'MMM d')}
                        {overdue && ' ⚠️'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {isAdmin && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8, borderStyle: 'dashed' }}
                onClick={() => onAddTask(status)}
              >
                + Add Task
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
 
// ---- Main Page ----
export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState('todo');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const isAdmin = user?.role === 'admin';
 
  const fetchData = useCallback(async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`)
      ]);
      setProject(projRes.data);
      setTasks(taskRes.data);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) navigate('/projects');
      else toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);
 
  useEffect(() => { fetchData(); }, [fetchData]);
 
  const handleTaskSaved = (task, isNew, isDelete) => {
    if (isDelete) {
      setTasks(prev => prev.filter(t => t._id !== task._id));
    } else if (isNew) {
      setTasks(prev => [task, ...prev]);
    } else {
      setTasks(prev => prev.map(t => t._id === task._id ? task : t));
    }
  };
 
  const handleAddTask = (status) => {
    setNewTaskStatus(status);
    setSelectedTask(null);
    setShowTaskModal(true);
  };
 
  if (loading) return <div className="loading-spinner"><div className="spinner"></div> Loading project...</div>;
  if (!project) return null;
 
  const overdueTasks = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done');
 
  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>← Back</button>
            <span className={`badge badge-${project.status === 'active' ? 'in-progress' : project.status === 'completed' ? 'done' : 'todo'}`}>
              {project.status}
            </span>
            {overdueTasks.length > 0 && <span className="badge badge-overdue">⚠️ {overdueTasks.length} overdue</span>}
          </div>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isAdmin && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>👥 Add Member</button>
              <button className="btn btn-primary" onClick={() => { setSelectedTask(null); setShowTaskModal(true); }}>+ Add Task</button>
            </>
          )}
        </div>
      </div>
 
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #e2e8f0' }}>
        {['board', 'list', 'members'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === tab ? '#6366f1' : '#64748b',
              marginBottom: -2,
              textTransform: 'capitalize'
            }}
          >
            {tab === 'board' ? '📋 Board' : tab === 'list' ? '📝 List' : '👥 Members'}
          </button>
        ))}
      </div>
 
      {/* Board View */}
      {activeTab === 'board' && (
        <KanbanBoard
          tasks={tasks}
          onTaskClick={task => { setSelectedTask(task); setShowTaskModal(true); }}
          onAddTask={handleAddTask}
          isAdmin={isAdmin}
        />
      )}
 
      {/* List View */}
      {activeTab === 'list' && (
        <div className="card">
          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <div className="empty-title">No tasks yet</div>
              {isAdmin && <div className="empty-desc">Click "+ Add Task" to get started</div>}
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assigned To</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => {
                    const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
                    return (
                      <tr key={task._id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedTask(task); setShowTaskModal(true); }}>
                        <td style={{ fontWeight: 500 }}>{task.title}</td>
                        <td><span className={`badge badge-${task.status}`}>{task.status}</span></td>
                        <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                        <td>{task.assignedTo?.name || <span style={{ color: '#94a3b8' }}>Unassigned</span>}</td>
                        <td className={overdue ? 'task-card-due overdue' : 'task-card-due'}>
                          {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '—'}
                          {overdue && ' ⚠️'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
 
      {/* Members View */}
      {activeTab === 'members' && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Team Members ({project.members?.length})</h3>
          {project.members?.map(m => (
            <div key={m.user._id} className="member-row">
              <div className="user-avatar" style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>
                {m.user.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div className="member-name">{m.user.name}</div>
                <div className="member-email">{m.user.email}</div>
              </div>
              <span className={`badge badge-${m.role}`}>{m.role}</span>
              {isAdmin && project.owner?._id !== m.user._id && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={async () => {
                    try {
                      await api.delete(`/projects/${id}/members/${m.user._id}`);
                      setProject(prev => ({ ...prev, members: prev.members.filter(x => x.user._id !== m.user._id) }));
                      toast.success('Member removed');
                    } catch { toast.error('Failed to remove'); }
                  }}
                >Remove</button>
              )}
            </div>
          ))}
        </div>
      )}
 
      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          onClose={() => { setShowTaskModal(false); setSelectedTask(null); }}
          onSaved={handleTaskSaved}
          projectMembers={project.members || []}
          projectId={id}
          currentUser={user}
        />
      )}
      {showMemberModal && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowMemberModal(false)}
          onAdded={updatedProject => setProject(updatedProject)}
        />
      )}
    </div>
  );
}