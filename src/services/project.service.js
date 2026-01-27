import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'

const projectCol = collection(db, 'projects')
const logCol = collection(db, 'activity_logs')

export const subscribeProjects = callback => {
  return onSnapshot(projectCol, snap => {
    callback(
      snap.docs.map(d => ({ id: d.id, ...d.data() }))
    )
  })
}

export const createProject = async data => {
  await addDoc(projectCol, {
    ...data,
    budget: Number(data.budget),
    status: 'AKTIF',
    createdAt: serverTimestamp()
  })
  await logActivity('CREATE', data.name)
}

export const updateProject = async data => {
  await updateDoc(doc(db, 'projects', data.id), {
    ...data,
    budget: Number(data.budget)
  })
  await logActivity('UPDATE', data.name)
}

export const deleteProject = async (id, name = '-') => {
  await deleteDoc(doc(db, 'projects', id))
  await logActivity('DELETE', name)
}

export const logActivity = async (action, projectName) => {
  await addDoc(logCol, {
    action,
    projectName,
    createdAt: serverTimestamp()
  })
}
