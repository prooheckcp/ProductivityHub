import type { JSX } from 'react'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import { PlusIcon } from '../components/icons'

export default function Todo(): JSX.Element {
  return (
    <>
      <PageHeader
        title="To-Do"
        subtitle="Organize tasks by project, with sub-lists for the details."
        actions={
          <Button variant="primary">
            <PlusIcon size={15} />
            New Project
          </Button>
        }
      />

      <EmptyState
        title="No projects yet"
        description="Create a project to start adding tasks and sub-lists."
        action={
          <Button variant="secondary">
            <PlusIcon size={15} />
            New Project
          </Button>
        }
      />
    </>
  )
}
