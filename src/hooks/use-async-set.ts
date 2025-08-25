import { type PromiseFn, type SetState } from "@/app/types";
import { useTransition } from "react";

export const useAsyncSet = <T>(act: PromiseFn<T>, set: SetState<T>) => {
  const [pending, fn] = useTransition();
  const startFn = () => {
    fn(async () => {
      set(await act());
    });
  };
  return { startFn, pending };
};
