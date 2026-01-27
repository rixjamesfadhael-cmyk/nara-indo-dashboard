import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

export const loginWithEmail = async (email, password) => {
  if (!email || !password) {
    throw new Error('EMPTY_CREDENTIAL')
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )
    return userCredential.user
  } catch (error) {
    throw new Error('INVALID_CREDENTIAL')
  }
}
