// src/utils/projectArchive.js
import { PAYMENT_STATUS } from '../services/payment.config'

export const isWorkflowCompleted = workflow => {
  if (!Array.isArray(workflow) || workflow.length === 0) return false
  return workflow.every(step => Number(step.progress) >= 100)
}

export const canArchiveProject = project => {
  if (!project) return false
  if (project.archived === true) return false

  const FINAL_PAYMENT_STATUS =
    PAYMENT_STATUS[PAYMENT_STATUS.length - 1]

  return (
    isWorkflowCompleted(project.workflow) &&
    project.paymentStatus === FINAL_PAYMENT_STATUS
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
