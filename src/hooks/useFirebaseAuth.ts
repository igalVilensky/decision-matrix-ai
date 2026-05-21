import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { getFirebaseServices, getFirebaseSetupError } from "../services/firebase";

type FirebaseAuthState = {
  user: User | null;
  uid: string | undefined;
  isAuthReady: boolean;
  isSigningIn: boolean;
  authError: string | undefined;
};

export const useFirebaseAuth = (): FirebaseAuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | undefined>(() => getFirebaseSetupError());

  useEffect(() => {
    const setupError = getFirebaseSetupError();
    if (setupError) {
      setAuthError(setupError);
      setIsAuthReady(true);
      setIsSigningIn(false);
      return undefined;
    }

    const { auth } = getFirebaseServices();

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        if (nextUser) {
          setUser(nextUser);
          setIsSigningIn(false);
          setIsAuthReady(true);
          return;
        }

        setUser(null);
        setIsSigningIn(true);
        void signInAnonymously(auth)
          .then((credential) => {
            setUser(credential.user);
            setAuthError(undefined);
          })
          .catch((error: unknown) => {
            setAuthError(
              error instanceof Error
                ? `Anonymous sign-in failed: ${error.message}`
                : "Anonymous sign-in failed."
            );
          })
          .finally(() => {
            setIsSigningIn(false);
            setIsAuthReady(true);
          });
      },
      (error) => {
        setAuthError(`Firebase auth failed: ${error.message}`);
        setIsSigningIn(false);
        setIsAuthReady(true);
      }
    );

    return unsubscribe;
  }, []);

  return {
    user,
    uid: user?.uid,
    isAuthReady,
    isSigningIn,
    authError
  };
};
