import { useCallback, useEffect, useState } from 'react'
import type { Category, CategoryFormInput, Project, ProjectFormInput, Task, TaskFormInput, TaskStatus } from '@shared/types'

export function useTodo() {
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => Date.now())

  const refresh = useCallback(async () => {
    const [projectList, categoryList, taskList] = await Promise.all([
      window.api.todo.projects.list(),
      window.api.todo.categories.list(),
      window.api.todo.tasks.list()
    ])
    setProjects(projectList)
    setCategories(categoryList)
    setTasks(taskList)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const hasRunning = tasks.some((task) => task.runningSince !== null)
    if (!hasRunning) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [tasks])

  // A task linked to a timer can auto-finish in the main process (timerTaskWatcher)
  // purely from that timer running elsewhere (e.g. the Home widget) — poll lightly
  // so this task list picks up the status flip without the user touching anything.
  useEffect(() => {
    const hasLinkedTask = tasks.some((task) => task.linkedTimerId !== null)
    if (!hasLinkedTask) return
    const interval = setInterval(() => {
      window.api.todo.tasks.list().then(setTasks)
    }, 5000)
    return () => clearInterval(interval)
  }, [tasks])

  // ---- Projects ----
  const createProject = useCallback(async (input: ProjectFormInput) => {
    const project = await window.api.todo.projects.create(input)
    setProjects((prev) => [...prev, project])
    return project
  }, [])

  const updateProject = useCallback(async (id: string, patch: ProjectFormInput) => {
    const project = await window.api.todo.projects.update(id, patch)
    setProjects((prev) => prev.map((p) => (p.id === id ? project : p)))
    return project
  }, [])

  const removeProject = useCallback(async (id: string) => {
    await window.api.todo.projects.remove(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
    const categoryIds = new Set(categories.filter((c) => c.projectId === id).map((c) => c.id))
    setCategories((prev) => prev.filter((c) => c.projectId !== id))
    setTasks((prev) => prev.filter((t) => !categoryIds.has(t.categoryId)))
  }, [categories])

  // ---- Categories ----
  const createCategory = useCallback(async (projectId: string, input: CategoryFormInput) => {
    const category = await window.api.todo.categories.create(projectId, input)
    setCategories((prev) => [...prev, category])
    return category
  }, [])

  const updateCategory = useCallback(async (id: string, patch: CategoryFormInput) => {
    const category = await window.api.todo.categories.update(id, patch)
    setCategories((prev) => prev.map((c) => (c.id === id ? category : c)))
    return category
  }, [])

  const removeCategory = useCallback(async (id: string) => {
    await window.api.todo.categories.remove(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
    setTasks((prev) => prev.filter((t) => t.categoryId !== id))
  }, [])

  // ---- Tasks ----
  const createTask = useCallback(async (categoryId: string, parentTaskId: string | null, input: TaskFormInput) => {
    const task = await window.api.todo.tasks.create(categoryId, parentTaskId, input)
    setTasks((prev) => [...prev, task])
    return task
  }, [])

  const updateTask = useCallback(async (id: string, patch: TaskFormInput) => {
    const task = await window.api.todo.tasks.update(id, patch)
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)))
    return task
  }, [])

  const removeTask = useCallback(async (id: string) => {
    await window.api.todo.tasks.remove(id)
    setTasks((prev) => prev.filter((t) => t.id !== id && t.parentTaskId !== id))
  }, [])

  const setTaskStatus = useCallback(async (id: string, status: TaskStatus) => {
    const task = await window.api.todo.tasks.setStatus(id, status)
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)))
    return task
  }, [])

  const startTask = useCallback(async (id: string) => {
    const task = await window.api.todo.tasks.start(id)
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)))
    return task
  }, [])

  const pauseTask = useCallback(async (id: string) => {
    const task = await window.api.todo.tasks.pause(id)
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)))
    return task
  }, [])

  return {
    projects,
    categories,
    tasks,
    loading,
    now,
    createProject,
    updateProject,
    removeProject,
    createCategory,
    updateCategory,
    removeCategory,
    createTask,
    updateTask,
    removeTask,
    setTaskStatus,
    startTask,
    pauseTask
  }
}
