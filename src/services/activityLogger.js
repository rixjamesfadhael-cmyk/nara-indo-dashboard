import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export async function logActivity({
  action,
  projectId,
  projectName,
  description
}) {
  await addDoc(collection(db, 'activity_logs'), {
    action,
    projectId,
    projectName,
    description,
    createdAt: serverTimestamp()
  })
}
