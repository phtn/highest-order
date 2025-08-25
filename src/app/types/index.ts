import type { HTMLProps } from "react";
export type ClassName = HTMLProps<HTMLElement>["className"];
export type PromiseFn<T> = (params?: T) => Promise<T>;
export type SetState<T> = (state: T | ((prevState: T) => T)) => void;
