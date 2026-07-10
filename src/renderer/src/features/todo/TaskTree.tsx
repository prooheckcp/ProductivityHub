import { useState } from 'react'
import type { JSX } from 'react'
import type { Task, TaskStatus } from '@shared/types'
import TaskRow from './TaskRow'
import './TaskTree.css'

type TaskTreeProps = {
  task: Task
  allTasks: Task[]
  depth: number
  onOpen: (task: Task) => void
  onChangeStatus: (id: string, status: TaskStatus) => void
}

export default function TaskTree({ task, allTasks, depth, onOpen, onChangeStatus }: TaskTreeProps): JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const children = allTasks.filter((t) => t.parentTaskId === task.id)
  const completedChildren = children.filter((t) => t.status === 'finished').length

  return (
    <div className="task-tree" style={depth > 0 ? { paddingLeft: 26 } : undefined}>
      <TaskRow
        task={task}
        subtaskCount={children.length}
        expandable={children.length > 0}
        expanded={expanded}
        onToggleExpand={() => setExpanded((v) => !v)}
        progress={children.length > 0 ? { completed: completedChildren, total: children.length } : null}
        onOpen={() => onOpen(task)}
        onChangeStatus={(status) => onChangeStatus(task.id, status)}
      />
      {expanded && children.length > 0 && (
        <div className="task-tree__children">
          {children.map((child) => (
            <TaskTree
              key={child.id}
              task={child}
              allTasks={allTasks}
              depth={depth + 1}
              onOpen={onOpen}
              onChangeStatus={onChangeStatus}
            />
          ))}
        </div>
      )}
    </div>
  )
}
