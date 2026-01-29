import { WORKFLOW_CONFIG } from '../services/workflow.config'

export const safeWorkflow = wf => (Array.isArray(wf) ? wf : [])

export const calcProgress = wf => {
  const workflow = safeWorkflow(wf)
  if (workflow.length === 0) return 0
  return Math.round(
    workflow.reduce((a, b) => a + (Number(b.progress) || 0), 0) /
      workflow.length
  )
}

export const normalizeProject = p => ({
  ...p,
  workflow: safeWorkflow(p.workflow),
  paymentStatus: p.paymentStatus || 'Belum Bayar'
})

export const buildWorkflow = (division, subDivision) => {
  const cfg = WORKFLOW_CONFIG[division]
  if (!cfg) return []

  const steps = cfg.subs
    ? cfg.subs[subDivision]?.steps || []
    : cfg.steps

  return steps.map(s => ({ label: s, progress: 0 }))
}

export const hitungTanggalSelesai = (mulai, durasi) => {
  if (!mulai || !durasi) return ''
  const d = new Date(mulai)
  d.setDate(d.getDate() + Number(durasi))
  return d.toISOString().slice(0, 10)
}

export const isStepLocked = (workflow, index) => {
  if (index === 0) return false
  return Number(workflow[index - 1]?.progress || 0) < 100
}
