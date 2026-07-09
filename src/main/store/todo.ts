import { randomUUID } from 'crypto'
import type { Category, CategoryFormInput, Project, ProjectFormInput, Task, TaskFormInput } from '../../shared/types'
import { dataFile } from './paths'
import { readJsonFile, writeJsonFile } from './jsonFile'

const projectsFile = (): string => dataFile('projects.json')
const categoriesFile = (): string => dataFile('categories.json')
const tasksFile = (): string => dataFile('tasks.json')

function loadProjects(): Project[] {
  return readJsonFile<Project[]>(projectsFile(), [])
}
function saveProjects(projects: Project[]): void {
  writeJsonFile(projectsFile(), projects)
}
function loadCategories(): Category[] {
  return readJsonFile<Category[]>(categoriesFile(), [])
}
function saveCategories(categories: Category[]): void {
  writeJsonFile(categoriesFile(), categories)
}
function loadTasks(): Task[] {
  return readJsonFile<Task[]>(tasksFile(), [])
}
function saveTasks(tasks: Task[]): void {
  writeJsonFile(tasksFile(), tasks)
}

function mustFind<T extends { id: string }>(items: T[], id: string, label: string): T {
  const item = items.find((i) => i.id === id)
  if (!item) throw new Error(`${label} not found: ${id}`)
  return item
}

// ---- Projects ----

export function listProjects(): Project[] {
  return loadProjects()
}

export function createProject(input: ProjectFormInput): Project {
  const now = Date.now()
  const project: Project = {
    id: randomUUID(),
    name: input.name.trim() || 'Untitled project',
    description: input.description.trim(),
    createdAt: now,
    updatedAt: now
  }
  const projects = loadProjects()
  projects.push(project)
  saveProjects(projects)
  return project
}

export function updateProject(id: string, patch: ProjectFormInput): Project {
  const projects = loadProjects()
  const project = mustFind(projects, id, 'Project')
  project.name = patch.name.trim() || project.name
  project.description = patch.description.trim()
  project.updatedAt = Date.now()
  saveProjects(projects)
  return project
}

export function deleteProject(id: string): void {
  saveProjects(loadProjects().filter((p) => p.id !== id))
  const categoryIds = new Set(loadCategories().filter((c) => c.projectId === id).map((c) => c.id))
  saveCategories(loadCategories().filter((c) => c.projectId !== id))
  saveTasks(loadTasks().filter((t) => !categoryIds.has(t.categoryId)))
}

// ---- Categories ----

export function listCategories(projectId?: string): Category[] {
  const categories = loadCategories()
  return projectId ? categories.filter((c) => c.projectId === projectId) : categories
}

export function createCategory(projectId: string, input: CategoryFormInput): Category {
  const now = Date.now()
  const categories = loadCategories()
  const order = categories.filter((c) => c.projectId === projectId).length
  const category: Category = {
    id: randomUUID(),
    projectId,
    name: input.name.trim() || 'Untitled category',
    order,
    createdAt: now,
    updatedAt: now
  }
  categories.push(category)
  saveCategories(categories)
  return category
}

export function updateCategory(id: string, patch: CategoryFormInput): Category {
  const categories = loadCategories()
  const category = mustFind(categories, id, 'Category')
  category.name = patch.name.trim() || category.name
  category.updatedAt = Date.now()
  saveCategories(categories)
  return category
}

export function deleteCategory(id: string): void {
  saveCategories(loadCategories().filter((c) => c.id !== id))
  saveTasks(loadTasks().filter((t) => t.categoryId !== id))
}

// ---- Tasks ----

export function listTasks(categoryId?: string): Task[] {
  const tasks = loadTasks()
  return categoryId ? tasks.filter((t) => t.categoryId === categoryId) : tasks
}

export function createTask(categoryId: string, parentTaskId: string | null, input: TaskFormInput): Task {
  const now = Date.now()
  const tasks = loadTasks()
  const order = tasks.filter((t) => t.categoryId === categoryId && t.parentTaskId === parentTaskId).length
  const task: Task = {
    id: randomUUID(),
    categoryId,
    parentTaskId,
    name: input.name.trim() || 'Untitled task',
    description: input.description,
    images: input.images,
    priority: input.priority,
    deadline: input.deadline,
    estimatedMs: input.estimatedMs,
    accumulatedMs: 0,
    runningSince: null,
    completed: false,
    completedAt: null,
    deadlineNotifiedAt: null,
    order,
    createdAt: now,
    updatedAt: now
  }
  tasks.push(task)
  saveTasks(tasks)
  return task
}

export function updateTask(id: string, patch: TaskFormInput): Task {
  const tasks = loadTasks()
  const task = mustFind(tasks, id, 'Task')
  task.name = patch.name.trim() || task.name
  task.description = patch.description
  task.images = patch.images
  task.priority = patch.priority
  task.deadline = patch.deadline
  task.estimatedMs = patch.estimatedMs
  task.updatedAt = Date.now()
  if (task.deadline === null) task.deadlineNotifiedAt = null
  saveTasks(tasks)
  return task
}

export function deleteTask(id: string): void {
  const tasks = loadTasks()
  const toDelete = new Set<string>([id])
  // cascade-delete subtasks (and their subtasks, arbitrary depth)
  let grew = true
  while (grew) {
    grew = false
    for (const task of tasks) {
      if (task.parentTaskId && toDelete.has(task.parentTaskId) && !toDelete.has(task.id)) {
        toDelete.add(task.id)
        grew = true
      }
    }
  }
  saveTasks(tasks.filter((t) => !toDelete.has(t.id)))
}

/** Returns [task, becameCompleted] so callers can drive achievement counters correctly. */
export function setTaskCompleted(id: string, completed: boolean): { task: Task; changed: boolean } {
  const tasks = loadTasks()
  const task = mustFind(tasks, id, 'Task')
  const changed = task.completed !== completed
  task.completed = completed
  task.completedAt = completed ? Date.now() : null
  if (completed && task.runningSince !== null) {
    task.accumulatedMs += Math.max(0, Date.now() - task.runningSince)
    task.runningSince = null
  }
  task.updatedAt = Date.now()
  saveTasks(tasks)
  return { task, changed }
}

export function startTask(id: string): Task {
  const tasks = loadTasks()
  const task = mustFind(tasks, id, 'Task')
  if (task.runningSince === null) {
    task.runningSince = Date.now()
    task.updatedAt = task.runningSince
  }
  saveTasks(tasks)
  return task
}

export function pauseTask(id: string): Task {
  const tasks = loadTasks()
  const task = mustFind(tasks, id, 'Task')
  if (task.runningSince !== null) {
    task.accumulatedMs += Math.max(0, Date.now() - task.runningSince)
    task.runningSince = null
  }
  task.updatedAt = Date.now()
  saveTasks(tasks)
  return task
}

export function markTaskDeadlineNotified(id: string): void {
  const tasks = loadTasks()
  const task = tasks.find((t) => t.id === id)
  if (!task) return
  task.deadlineNotifiedAt = Date.now()
  saveTasks(tasks)
}

export function restoreTodoData(data: { projects: Project[]; categories: Category[]; tasks: Task[] }): void {
  saveProjects(data.projects)
  saveCategories(data.categories)
  saveTasks(data.tasks)
}
