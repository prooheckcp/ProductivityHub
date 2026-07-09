import { useState } from 'react'
import type { JSX } from 'react'
import Card from '../../components/Card'
import ProgressBar from '../../components/ProgressBar'
import { CloseIcon, PlusIcon } from '../../components/icons'
import type { Category, Task } from '@shared/types'
import TaskRow from './TaskRow'
import './CategorySection.css'

type CategorySectionProps = {
  category: Category
  tasks: Task[]
  onOpenTask: (task: Task) => void
  onToggleCompleted: (id: string, completed: boolean) => void
  onAddTask: (name: string) => Promise<void>
  onDeleteCategory: () => void
}

export default function CategorySection({
  category,
  tasks,
  onOpenTask,
  onToggleCompleted,
  onAddTask,
  onDeleteCategory
}: CategorySectionProps): JSX.Element {
  const [newTaskName, setNewTaskName] = useState('')
  const topLevel = tasks.filter((task) => task.parentTaskId === null)
  const allInCategory = tasks
  const completedCount = allInCategory.filter((task) => task.completed).length
  const percent = allInCategory.length === 0 ? 0 : (completedCount / allInCategory.length) * 100

  async function handleAdd(): Promise<void> {
    if (!newTaskName.trim()) return
    await onAddTask(newTaskName.trim())
    setNewTaskName('')
  }

  return (
    <Card className="category-section">
      <div className="category-section__header">
        <div className="category-section__heading">
          <p className="category-section__name">{category.name}</p>
          <span className="category-section__count">
            {completedCount}/{allInCategory.length}
          </span>
        </div>
        <button type="button" className="category-section__delete" onClick={onDeleteCategory} aria-label="Delete category">
          <CloseIcon size={14} />
        </button>
      </div>
      <ProgressBar percent={percent} />

      <div className="category-section__tasks">
        {topLevel.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            subtaskCount={tasks.filter((t) => t.parentTaskId === task.id).length}
            onOpen={() => onOpenTask(task)}
            onToggleCompleted={() => onToggleCompleted(task.id, !task.completed)}
          />
        ))}
      </div>

      <div className="category-section__add-task">
        <input
          type="text"
          className="category-section__input"
          value={newTaskName}
          onChange={(event) => setNewTaskName(event.target.value)}
          placeholder="Add a task…"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleAdd()
            }
          }}
        />
        <button type="button" className="category-section__add-button" onClick={handleAdd} aria-label="Add task">
          <PlusIcon size={14} />
        </button>
      </div>
    </Card>
  )
}
