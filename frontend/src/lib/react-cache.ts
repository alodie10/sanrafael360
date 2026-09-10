import * as React from "react";

type ReactCache = <T extends Function>(fn: T) => T;

/** Next RSC exposes `cache` at runtime; React 18 types do not. */
export const cache: ReactCache = (
  React as typeof React & { cache: ReactCache }
).cache;
