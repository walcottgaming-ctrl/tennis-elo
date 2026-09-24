"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

export type SportMode =
  | "tennis"
  | "padel"
  | "super_tiebreak";

type SportModeContextValue = {
  mode: SportMode;
  setMode: (mode: SportMode) => void;
};

const SportModeContext =
  createContext<SportModeContextValue | null>(null);

const STORAGE_KEY = "smashbreakpoint-sport-mode";
const STORAGE_EVENT =
  "smashbreakpoint-sport-mode-change";

function getStoredMode(): SportMode {
  const storedMode =
    window.localStorage.getItem(STORAGE_KEY);

  if (
    storedMode === "tennis" ||
    storedMode === "padel" ||
    storedMode === "super_tiebreak"
  ) {
    return storedMode;
  }

  return "tennis";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(STORAGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

function getServerSnapshot(): SportMode {
  return "tennis";
}

export function SportModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const mode = useSyncExternalStore(
    subscribe,
    getStoredMode,
    getServerSnapshot
  );

  useEffect(() => {
    document.documentElement.dataset.sportMode =
      mode;
  }, [mode]);

  function setMode(nextMode: SportMode) {
    window.localStorage.setItem(
      STORAGE_KEY,
      nextMode
    );

    window.dispatchEvent(
      new Event(STORAGE_EVENT)
    );
  }

  return (
    <SportModeContext.Provider
      value={{
        mode,
        setMode,
      }}
    >
      {children}
    </SportModeContext.Provider>
  );
}

export function useSportMode() {
  const context = useContext(SportModeContext);

  if (!context) {
    throw new Error(
      "useSportMode must be used inside SportModeProvider"
    );
  }

  return context;
}