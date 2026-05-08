import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
 
function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', dueDate: '' });
  const [loading, setLoading] = useState(false);
 
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/projects', form);
      onCreated(data);
      toast.success('Project created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">New Project</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Website Redesign" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What is this project about?" />
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
 
export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
 
  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
 
  const filtered = projects.filter(p => filter === 'all' ? true : p.status === filter);
 
  if (loading) return <div className="loading-spinner"><div className="spinner"></div> Loading...</div>;
 
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        )}
      </div>
 
      <div className="filter-bar">
        {['all', 'active', 'completed', 'archived'].map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
 
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <div className="empty-title">{user?.role === 'admin' ? 'No projects yet' : 'No projects assigned'}</div>
          <div className="empty-desc">
            {user?.role === 'admin' ? 'Create your first project to get started' : 'Ask an admin to add you to a project'}
          </div>
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map(project => (
            <ProjectCard key={project._id} project={project} onClick={() => navigate(`/projects/${project._id}`)} />
          ))}
        </div>
      )}
 
      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreated={p => setProjects([p, ...projects])}
        />
      )}
    </div>
  );
}
 
function ProjectCard({ project, onClick }) {
  const [stats, setStats] = useState(null);
 
  useEffect(() => {
    api.get(`/projects/${project._id}/stats`).then(r => setStats(r.data)).catch(() => {});
  }, [project._id]);
 
  const progress = stats ? (stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0) : 0;
 
  return (
    <div className="project-card" onClick={onClick}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className={`badge badge-${project.status === 'active' ? 'in-progress' : project.status === 'completed' ? 'done' : 'todo'}`}>
            {project.status}
          </span>
          {stats?.overdue > 0 && <span className="badge badge-overdue">⚠️ {stats.overdue} overdue</span>}
        </div>
        <div className="project-card-title">{project.name}</div>
        {project.description && <div className="project-card-desc">{project.description}</div>}
      </div>
 
      {stats && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>
            <span>{stats.done}/{stats.total} tasks done</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
      )}
 
      <div className="project-card-footer">
        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
          👥 {project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}
        </div>
        {project.dueDate && (
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            📅 {format(new Date(project.dueDate), 'MMM d, yyyy')}
          </div>
        )}
      </div>
    </div>
  );
}