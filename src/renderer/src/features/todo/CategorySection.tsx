import { useState } from 'react'
import type { JSX } from 'react'
import { ChevronDownIcon, CloseIcon, PlusIcon } from '../../components/icons'
import type { Category, Task, TaskStatus } from '@shared/types'
import TaskRow from './TaskRow'
import './CategorySection.css'

type CategorySectionProps = {
  category: Category
  tasks: Task[]
  onOpenTask: (task: Task) => void
  onChangeTaskStatus: (id: string, status: TaskStatus) => void
  onAddTask: (name: string) => Promise<void>
  onDeleteCategory: () => void
}

export default function CategorySection({
  category,
  tasks,
  onOpenTask,
  onChangeTaskStatus,
  onAddTask,
  onDeleteCategory
}: CategorySectionProps): JSX.Element {
  const [newTaskName, setNewTaskName] = useState('')
  const [adding, setAdding] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const topLevel = tasks.filter((task) => task.parentTaskId === null)
  const allInCategory = tasks
  const completedCount = allInCategory.filter((task) => task.status === 'finished').length
  const percent = allInCategory.length === 0 ? 0 : (completedCount / allInCategory.length) * 100

  async function handleAdd(): Promise<void> {
    if (!newTaskName.trim()) return
    await onAddTask(newTaskName.trim())
    setNewTaskName('')
  }

  return (
    <div className="category-group">
      <div className="category-group__header">
        <button
          type="button"
          className="category-group__collapse"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand category' : 'Collapse category'}
        >
          <span className={'category-group__chevron' + (collapsed ? ' category-group__chevron--collapsed' : '')}>
            <ChevronDownIcon size={14} />
          </span>
          <span className="category-group__name">{category.name}</span>
          <span className="category-group__count">{completedCount}/{allInCategory.length}</span>
        </button>
        <span className="category-group__progress-track">
          <span className="category-group__progress-fill" style={{ width: `${percent}%` }} />
        </span>
        <button type="button" className="category-group__delete" onClick={onDeleteCategory} aria-label="Delete category">
          <CloseIcon size={13} />
        </button>
      </div>

      {!collapsed && (
        <div className="category-group__tasks">
          {topLevel.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              subtaskCount={tasks.filter((t) => t.parentTaskId === task.id).length}
              onOpen={() => onOpenTask(task)}
              onChangeStatus={(status) => onChangeTaskStatus(task.id, status)}
            />
          ))}

          {adding ? (
            <div className="category-group__add-row category-group__add-row--editing">
              <input
                autoFocus
                type="text"
                className="category-group__add-input"
                value={newTaskName}
                onChange={(event) => setNewTaskName(event.target.value)}
                placeholder="Task name…"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleAdd()
                  }
                  if (event.key === 'Escape') setAdding(false)
                }}
                onBlur={() => {
                  if (!newTaskName.trim()) setAdding(false)
                }}
              />
              <button type="button" className="category-group__add-confirm" onClick={handleAdd}>
                Add
              </button>
            </div>
          ) : (
            <button type="button" className="category-group__add-row" onClick={() => setAdding(true)}>
              <PlusIcon size={13} />
              Add task
            </button>
          )}
        </div>
      )}
    </div>
  )
}
