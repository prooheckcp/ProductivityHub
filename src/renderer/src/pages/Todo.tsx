import { useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import { PlusIcon } from '../components/icons'
import { useTodo } from '../features/todo/useTodo'
import ProjectCard from '../features/todo/ProjectCard'
import ProjectFormModal from '../features/todo/ProjectFormModal'
import './Todo.css'

export default function Todo(): JSX.Element {
  const { projects, categories, tasks, loading, createProject, updateProject, removeProject } = useTodo()
  const navigate = useNavigate()

  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const editingProject = projects.find((p) => p.id === editingId) ?? null

  function tasksForProject(projectId: string) {
    const categoryIds = new Set(categories.filter((c) => c.projectId === projectId).map((c) => c.id))
    return tasks.filter((t) => categoryIds.has(t.categoryId))
  }

  async function handleDeleteConfirmed(): Promise<void> {
    if (!deletingId) return
    await removeProject(deletingId)
    setDeletingId(null)
    setEditingId(null)
  }

  return (
    <>
      <PageHeader
        title="To-Do"
        subtitle="Organize tasks by project, with categories and subtasks."
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <PlusIcon size={15} />
            New Project
          </Button>
        }
      />

      {!loading && projects.length === 0 && (
        <EmptyState
          title="No projects yet"
          description="Create a project to start adding categories and tasks."
          action={
            <Button variant="secondary" onClick={() => setShowCreate(true)}>
              <PlusIcon size={15} />
              New Project
            </Button>
          }
        />
      )}

      {projects.length > 0 && (
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              name={project.name}
              description={project.description}
              imagePath={project.imagePath}
              tasks={tasksForProject(project.id)}
              onOpen={() => navigate(`/todo/${project.id}`)}
              onEdit={() => setEditingId(project.id)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <ProjectFormModal onClose={() => setShowCreate(false)} onSubmit={async (values) => void (await createProject(values))} />
      )}

      {editingProject && (
        <ProjectFormModal
          initial={editingProject}
          onClose={() => setEditingId(null)}
          onSubmit={async (values) => void (await updateProject(editingProject.id, values))}
          onDelete={() => setDeletingId(editingProject.id)}
        />
      )}

      {deletingId && (
        <ConfirmDialog
          title="Delete this project?"
          description="This deletes all of its categories and tasks. This can't be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </>
  )
}
