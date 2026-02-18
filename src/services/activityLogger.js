import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../firebase'

export async function logActivity({
  action,
  projectId,
  projectName,
  description
}) {
  const user = auth.currentUser

  await addDoc(collection(db, 'activity_logs'), {
    action,
    projectId,
    projectName,
    description,
    userEmail: user?.email || 'Unknown',
    createdAt: serverTimestamp()
  })
}
