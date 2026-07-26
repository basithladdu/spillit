import { useState, useEffect, createContext, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import { User, UseAuthReturn } from '@/types';
import { handleFirebaseError, ValidationRules, handleValidationError } from '@/utils/errors';

/**
 * Auth Context Type
 */
interface AuthContextType extends UseAuthReturn {
  isLoading: boolean;
}

/**
 * Create Auth Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom Hook: useAuth
 * Manages Firebase authentication and user state
 */
export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle Firebase Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await getUserData(firebaseUser);
          setCurrentUser(userData);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch User Data from Firestore
  async function getUserData(firebaseUser: FirebaseUser): Promise<User> {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as User;
    }

    // Create new user document if it doesn't exist
    const newUser: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(userRef, newUser);
    return newUser;
  }

  // Register new user with email/password
  async function register(email: string, password: string): Promise<void> {
    // Validate inputs
    const emailError = handleValidationError(
      'email',
      email,
      [ValidationRules.required, ValidationRules.email],
    );
    if (emailError) throw emailError;

    const passwordError = handleValidationError(
      'password',
      password,
      [
        ValidationRules.required,
        ValidationRules.minLength(6),
      ],
    );
    if (passwordError) throw passwordError;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await getUserData(userCredential.user);
    } catch (error) {
      throw handleFirebaseError(error);
    }
  }

  // Login user with email/password
  async function login(email: string, password: string): Promise<void> {
    // Validate inputs
    const emailError = handleValidationError(
      'email',
      email,
      [ValidationRules.required, ValidationRules.email],
    );
    if (emailError) throw emailError;

    const passwordError = handleValidationError(
      'password',
      password,
      [ValidationRules.required],
    );
    if (passwordError) throw passwordError;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw handleFirebaseError(error);
    }
  }

  // Logout user
  async function logout(): Promise<void> {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      throw handleFirebaseError(error);
    }
  }

  const value: AuthContextType = {
    currentUser,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
