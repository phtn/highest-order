import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useSettingsPanel } from "@/components/settings-panel";

export const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const { state } = useSettingsPanel();
  const isExpanded = useMemo(() => state === "expanded", [state]);
  return (
    <div
      className={cn(
        "flex-1 [&>div>div]:h-full w-full border-x-[0.5px] border-t-[0.5px] border-foreground/[0.30] min-[1024px]:rounded-e-3xl bg-background/80",
        "overflow-hidden shadow-lg shadow-foreground/10",
        { "md:rounded-t-3xl md:mx-4": isExpanded },
      )}
    >
      {children}
    </div>
  );
};
