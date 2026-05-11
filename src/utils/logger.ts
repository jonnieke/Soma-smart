export const warnIfDev = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
};
