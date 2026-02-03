// src/utils/projectArchive.js

export const isWorkflowCompleted = workflow => {
  if (!Array.isArray(workflow) || workflow.length === 0) return false
  return workflow.every(step => Number(step.progress) >= 100)
}

export const canArchiveProject = project => {
  if (!project) return false
  if (project.archived === true) return false

  return (
    Number(project.progress) === 100 &&
    isWorkflowCompleted(project.workflow) &&
    project.paymentStatus === 'Lunas'
  )
}

export const isArchivedProject = project => {
  return project?.archived === true
}

export const getFinalStepIndex = workflow => {
  if (!Array.isArray(workflow)) return -1
  return workflow.length - 1
}

export const canEditFinalStepInArchive = (workflow, stepIndex) => {
  return stepIndex === getFinalStepIndex(workflow)
}

export const shouldUnarchiveProject = workflow => {
  const idx = getFinalStepIndex(workflow)
  if (idx < 0) return false
  return Number(workflow[idx]?.progress) < 100
}
