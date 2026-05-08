import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';
 
const statusColors = { todo: '#64748b', 'in-progress': '#3b82f6', review: '#f59e0b', done: '#10b981' };
 
export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    api.get('/users/dashboard').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
 
  if (loading) return <div className="loading-spinner"><div className="spinner"></div> Loading dashboard...</div>;
 
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👋 Hey, {user?.name?.split(' ')[0]}!</h1>
          <p className="page-subtitle">Here's what's happening today.</p>
        </div>
      </div>
 
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#6366f1' }}>{stats?.total || 0}</div>
          <div className="stat-label">Total Assigned</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#3b82f6' }}>{stats?.inProgress || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#10b981' }}>{stats?.done || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#ef4444' }}>{stats?.overdue || 0}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>
 
      <div className="card">
        <h2 style={{ marginBottom: 16, fontSize: '1.1rem' }}>My Recent Tasks</h2>
        {!stats?.recentTasks?.length ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-title">No tasks assigned yet</div>
            <div className="empty-desc">Check your projects to pick up some work</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTasks.map(task => {
                  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
                  return (
                    <tr key={task._id}>
                      <td style={{ fontWeight: 500 }}>{task.title}</td>
                      <td>
                        <Link to={`/projects/${task.project?._id}`} style={{ color: '#6366f1', fontWeight: 500 }}>
                          {task.project?.name || '—'}
                        </Link>
                      </td>
                      <td>
                        <span className={`badge badge-${task.status}`}>{task.status}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      </td>
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
        <div style={{ marginTop: 16 }}>
          <Link to="/projects" className="btn btn-secondary btn-sm">View All Projects →</Link>
        </div>
      </div>
    </div>
  );
}
 