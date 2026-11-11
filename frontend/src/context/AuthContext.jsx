import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

function readStoredAuth() {
  const storages = [
    localStorage,
    sessionStorage,
  ];

  for (const storage of storages) {
    const token = storage.getItem("token");
    const storedUser =
      storage.getItem("user");

    if (!token || !storedUser) {
      continue;
    }

    try {
      return {
        token,
        user: JSON.parse(storedUser),
      };
    } catch {
      storage.removeItem("token");
      storage.removeItem("user");
    }
  }

  return {
    token: null,
    user: null,
  };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] =
    useState(readStoredAuth);

  function signIn({
    token,
    user,
    rememberMe = false,
  }) {
    const selectedStorage =
      rememberMe
        ? localStorage
        : sessionStorage;

    const otherStorage =
      rememberMe
        ? sessionStorage
        : localStorage;

    otherStorage.removeItem("token");
    otherStorage.removeItem("user");

    selectedStorage.setItem(
      "token",
      token,
    );

    selectedStorage.setItem(
      "user",
      JSON.stringify(user),
    );

    setAuth({
      token,
      user,
    });
  }

  function signOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setAuth({
      token: null,
      user: null,
    });
  }

  const contextValue = useMemo(
    () => ({
      token: auth.token,
      user: auth.user,

      isAuthenticated: Boolean(
        auth.token && auth.user,
      ),

      canModifyInformation:
        Boolean(
          auth.user
            ?.canModifyInformation,
        ),

      signIn,
      signOut,
    }),
    [auth],
  );

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}

export default AuthContext;
