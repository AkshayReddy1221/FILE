# FILE
# Team Task Manager

A full-stack web application for team project and task management
with role-based access control.

## Tech Stack
- Frontend  : React 18, React Router v6
- Backend   : Node.js, Express.js
- Database  : MongoDB (Mongoose)
- Auth      : JWT (JSON Web Tokens)

## Features
- Authentication (Signup/Login with JWT, Admin/Member roles)
- Project Management (Create, update, delete projects)
- Task Management (CRUD with status, priority, assignment, due dates)
- Dashboard (Personal task stats and overdue tracking)
- Kanban Board (To Do / In Progress / Review / Done)
- List View (Tabular task overview)
- Team View (Members and their roles)
- Overdue Detection (Auto-flags tasks past due date)

## Local Setup
1. cd backend && npm install
2. cp .env.example .env  (fill in your MongoDB URI and JWT secret)
3. npm start
4. In a new terminal: cd frontend && npm install && npm start
5. Open http://localhost:3000

## API Endpoints
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId
GET    /api/projects/:id/stats
GET    /api/tasks?project=id
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
GET    /api/tasks/my/assigned

## Role-Based Access
Action                        Admin   Member
Create project                  YES     NO
Add/remove members              YES     NO
Create/edit/delete tasks        YES     NO
Update status of own tasks      YES     YES
View board and tasks            YES     YES
