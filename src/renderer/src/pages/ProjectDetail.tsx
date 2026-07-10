import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Card from '../components/Card'
import ProgressBar from '../components/ProgressBar'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import { PlusIcon, SearchIcon, SettingsIcon } from '../components/icons'
import { toFileUrl } from '../utils/fileUrl'
import type { Task, TaskFormInput } from '@shared/types'
import { useTodo } from '../features/todo/useTodo'
import CategorySection from '../features/todo/CategorySection'
import TaskModal from '../features/todo/TaskModal'
import ProjectFormModal from '../features/todo/ProjectFormModal'
import { currentSprintNumber, hasSprintConfig } from '../features/todo/sprintMath'
import './ProjectDetail.css'

const BLANK_TASK: TaskFormInput = {
  name: '',
  description: '',
  images: [],
  priority: 'medium',
  deadline: null,
  estimatedMs: null,
  sprintNumber: null,
  linkedTimerId: null,
  timerTargetMs: null
}

const PRIORITY_RANK: Record<Task['priority'], number> = { urgent: 0, high: 1, medium: 2, low: 3 }

type SortOption = 'none' | 'priority' | 'deadline' | 'sprint'

export default function ProjectDetail(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const {
    projects,
    categories,
    tasks,
    loading,
    now,
    updateProject,
    removeProject,
    createCategory,
    removeCategory,
    createTask,
    updateTask,
    removeTask,
    setTaskStatus,
    startTask,
    pauseTask
  } = useTodo()

  const [newCategoryName, setNewCategoryName] = useState('')
  const [taskStack, setTaskStack] = useState<string[]>([])
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [editingSettings, setEditingSettings] = useState(false)
  const [deletingProject, setDeletingProject] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('none')
  const [sprintFilter, setSprintFilter] = useState<'all' | 'backlog' | number>('all')

  const project = projects.find((p) => p.id === projectId)
  const projectCategories = categories.filter((c) => c.projectId === projectId).sort((a, b) => a.order - b.order)
  const categoryIds = new Set(projectCategories.map((c) => c.id))
  const projectTasks = tasks.filter((t) => categoryIds.has(t.categoryId))
  const completedCount = projectTasks.filter((t) => t.status === 'finished').length
  const overallPercent = projectTasks.length === 0 ? 0 : (completedCount / projectTasks.length) * 100

  const sprintNumbers = useMemo(() => {
    const nums = new Set<number>()
    for (const task of projectTasks) {
      if (task.sprintNumber !== null) nums.add(task.sprintNumber)
    }
    if (project && hasSprintConfig(project)) {
      const current = currentSprintNumber(project, now)
      if (current !== null) for (let i = current; i < current + 3; i++) nums.add(i)
    }
    return [...nums].sort((a, b) => a - b)
  }, [projectTasks, project, now])

  const visibleTasks = useMemo(() => {
    let result = projectTasks
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((t) => t.name.toLowerCase().includes(q))
    }
    if (sprintFilter === 'backlog') {
      result = result.filter((t) => t.sprintNumber === null)
    } else if (sprintFilter !== 'all') {
      result = result.filter((t) => t.sprintNumber === sprintFilter)
    }
    if (sortBy === 'priority') {
      result = [...result].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    } else if (sortBy === 'deadline') {
      result = [...result].sort((a, b) => {
        if (a.deadline === null && b.deadline === null) return 0
        if (a.deadline === null) return 1
        if (b.deadline === null) return -1
        return a.deadline - b.deadline
      })
    } else if (sortBy === 'sprint') {
      result = [...result].sort((a, b) => {
        if (a.sprintNumber === null && b.sprintNumber === null) return 0
        if (a.sprintNumber === null) return 1
        if (b.sprintNumber === null) return -1
        return a.sprintNumber - b.sprintNumber
      })
    }
    return result
  }, [projectTasks, search, sprintFilter, sortBy])

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

  async function handleDeleteProjectConfirmed(): Promise<void> {
    if (!project) return
    await removeProject(project.id)
    setDeletingProject(false)
    navigate('/todo')
  }

  return (
    <>
      <button type="button" className="project-detail__back" onClick={() => navigate('/todo')}>
        ← All projects
      </button>

      <PageHeader
        title={project?.name ?? ''}
        subtitle={project?.description || 'No description yet.'}
        actions={
          <Button variant="secondary" onClick={() => setEditingSettings(true)}>
            <SettingsIcon size={14} />
            Settings
          </Button>
        }
      />

      {project?.imagePath && <img src={toFileUrl(project.imagePath)} alt="" className="project-detail__cover" />}

      {projectTasks.length > 0 && (
        <div className="project-detail__progress">
          <ProgressBar percent={overallPercent} label={`${completedCount}/${projectTasks.length} tasks complete`} />
        </div>
      )}

      <div className="project-detail__toolbar">
        <div className="project-detail__search">
          <SearchIcon size={14} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks…"
          />
        </div>
        <select
          className="project-detail__sort-select"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortOption)}
        >
          <option value="none">Sort by…</option>
          <option value="priority">Priority</option>
          <option value="deadline">Deadline</option>
          <option value="sprint">Sprint</option>
        </select>
        {sprintNumbers.length > 0 && (
          <select
            className="project-detail__sprint-select"
            value={sprintFilter}
            onChange={(event) => {
              const value = event.target.value
              setSprintFilter(value === 'all' || value === 'backlog' ? value : Number(value))
            }}
          >
            <option value="all">All sprints</option>
            <option value="backlog">Backlog</option>
            {sprintNumbers.map((n) => (
              <option key={n} value={n}>
                Sprint {n}
              </option>
            ))}
          </select>
        )}
      </div>

      {!loading && projectCategories.length === 0 ? (
        <EmptyState title="No categories yet" description="Add a category to start organizing tasks." />
      ) : (
        <Card className="todo-list-card">
          {projectCategories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              tasks={visibleTasks.filter((t) => t.categoryId === category.id)}
              onOpenTask={(task) => setTaskStack([task.id])}
              onChangeTaskStatus={setTaskStatus}
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

      {currentTask && project && (
        <TaskModal
          key={currentTask.id}
          task={currentTask}
          project={project}
          now={now}
          subtasks={tasks.filter((t) => t.parentTaskId === currentTask.id)}
          parentTask={currentTask.parentTaskId ? tasks.find((t) => t.id === currentTask.parentTaskId) : undefined}
          onClose={() => setTaskStack((stack) => stack.slice(0, -1))}
          onGoToParent={() => {
            if (currentTask.parentTaskId) setTaskStack([currentTask.parentTaskId])
          }}
          onCreate={async (input) => createTask(currentTask.categoryId, null, input)}
          onUpdate={updateTask}
          onDelete={async (id) => {
            await removeTask(id)
            setTaskStack((stack) => stack.slice(0, -1))
          }}
          onSetStatus={setTaskStatus}
          onStart={startTask}
          onPause={pauseTask}
          onAddSubtask={async (name) => {
            await createTask(currentTask.categoryId, currentTask.id, { ...BLANK_TASK, name })
          }}
          onOpenSubtask={(subtask) => setTaskStack((stack) => [...stack, subtask.id])}
        />
      )}

      {editingSettings && project && (
        <ProjectFormModal
          initial={project}
          onClose={() => setEditingSettings(false)}
          onSubmit={async (values) => void (await updateProject(project.id, values))}
          onDelete={() => {
            setEditingSettings(false)
            setDeletingProject(true)
          }}
        />
      )}

      {deletingProject && (
        <ConfirmDialog
          title="Delete this project?"
          description="This deletes all of its categories and tasks. This can't be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteProjectConfirmed}
          onCancel={() => setDeletingProject(false)}
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
