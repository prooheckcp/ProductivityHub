import { useState } from 'react'
import type { JSX } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Card from '../components/Card'
import ProgressBar from '../components/ProgressBar'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import { PlusIcon } from '../components/icons'
import type { TaskFormInput } from '@shared/types'
import { useTodo } from '../features/todo/useTodo'
import CategorySection from '../features/todo/CategorySection'
import TaskModal from '../features/todo/TaskModal'
import './ProjectDetail.css'

const BLANK_TASK: TaskFormInput = {
  name: '',
  description: '',
  images: [],
  priority: 'medium',
  deadline: null,
  estimatedMs: null
}

export default function ProjectDetail(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const {
    projects,
    categories,
    tasks,
    loading,
    now,
    createCategory,
    removeCategory,
    createTask,
    updateTask,
    removeTask,
    setTaskCompleted,
    startTask,
    pauseTask
  } = useTodo()

  const [newCategoryName, setNewCategoryName] = useState('')
  const [taskStack, setTaskStack] = useState<string[]>([])
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

  const project = projects.find((p) => p.id === projectId)
  const projectCategories = categories.filter((c) => c.projectId === projectId).sort((a, b) => a.order - b.order)
  const categoryIds = new Set(projectCategories.map((c) => c.id))
  const projectTasks = tasks.filter((t) => categoryIds.has(t.categoryId))
  const completedCount = projectTasks.filter((t) => t.completed).length
  const overallPercent = projectTasks.length === 0 ? 0 : (completedCount / projectTasks.length) * 100

  const currentTaskId = taskStack[taskStack.length - 1] ?? null
  const currentTask = currentTaskId ? tasks.find((t) => t.id === currentTaskId) : undefined

  if (!loading && !project) {
    return (
      <EmptyState
        title="Project not found"
        description="It may have been deleted."
        action={<Button variant="secondary" onClick={() => navigate('/todo')}>Back to projects</Button>}
      />
    )
  }

  async function handleAddCategory(): Promise<void> {
    if (!projectId || !newCategoryName.trim()) return
    await createCategory(projectId, { name: newCategoryName.trim() })
    setNewCategoryName('')
  }

  async function handleAddTaskInCategory(categoryId: string, name: string): Promise<void> {
    await createTask(categoryId, null, { ...BLANK_TASK, name })
  }

  async function handleDeleteCategoryConfirmed(): Promise<void> {
    if (!deletingCategoryId) return
    await removeCategory(deletingCategoryId)
    setDeletingCategoryId(null)
  }

  return (
    <>
      <button type="button" className="project-detail__back" onClick={() => navigate('/todo')}>
        ← All projects
      </button>

      <PageHeader title={project?.name ?? ''} subtitle={project?.description || 'No description yet.'} />

      {projectTasks.length > 0 && (
        <div className="project-detail__progress">
          <ProgressBar percent={overallPercent} label={`${completedCount}/${projectTasks.length} tasks complete`} />
        </div>
      )}

      {!loading && projectCategories.length === 0 ? (
        <EmptyState title="No categories yet" description="Add a category to start organizing tasks." />
      ) : (
        <Card className="todo-list-card">
          {projectCategories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              tasks={projectTasks.filter((t) => t.categoryId === category.id)}
              onOpenTask={(task) => setTaskStack([task.id])}
              onToggleCompleted={setTaskCompleted}
              onAddTask={(name) => handleAddTaskInCategory(category.id, name)}
              onDeleteCategory={() => setDeletingCategoryId(category.id)}
            />
          ))}
        </Card>
      )}

      <div className="project-detail__add-category">
        <input
          type="text"
          className="project-detail__input"
          value={newCategoryName}
          onChange={(event) => setNewCategoryName(event.target.value)}
          placeholder="Add a category…"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleAddCategory()
            }
          }}
        />
        <Button variant="secondary" onClick={handleAddCategory}>
          <PlusIcon size={14} />
          Add category
        </Button>
      </div>

      {currentTask && (
        <TaskModal
          task={currentTask}
          now={now}
          subtasks={tasks.filter((t) => t.parentTaskId === currentTask.id)}
          onClose={() => setTaskStack((stack) => stack.slice(0, -1))}
          onCreate={async (input) => createTask(currentTask.categoryId, null, input)}
          onUpdate={updateTask}
          onDelete={async (id) => {
            await removeTask(id)
            setTaskStack((stack) => stack.slice(0, -1))
          }}
          onSetCompleted={setTaskCompleted}
          onStart={startTask}
          onPause={pauseTask}
          onAddSubtask={async (name) => {
            await createTask(currentTask.categoryId, currentTask.id, { ...BLANK_TASK, name })
          }}
          onOpenSubtask={(subtask) => setTaskStack((stack) => [...stack, subtask.id])}
        />
      )}

      {deletingCategoryId && (
        <ConfirmDialog
          title="Delete this category?"
          description="This deletes all tasks inside it. This can't be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteCategoryConfirmed}
          onCancel={() => setDeletingCategoryId(null)}
        />
      )}
    </>
  )
}
