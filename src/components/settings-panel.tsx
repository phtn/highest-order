"use client";

import { useMobile } from "@/hooks/use-mobile";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SliderControl from "@/components/slider-control";
import { Sheet, SheetTitle, SheetContent } from "@/components/ui/sheet";
import {
  type ComponentProps,
  createContext,
  CSSProperties,
  type MouseEvent,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

type Collapsible = "none" | "icon" | "content";

interface SettingsPanelProviderProps extends ComponentProps<"div"> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type SettingsPanelContext = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  togglePanel: VoidFunction;
  collapsible?: Collapsible;
};

const SETTINGS_COOKIE_NAME = "settings:state";
const SETTINGS_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SETTINGS_WIDTH = "300px";
const SETTINGS_WIDTH_MOBILE = "18rem";
const SETTINGS_WIDTH_ICON = "3rem";
const SETTINGS_KEYBOARD_SHORTCUT = "p";

const SettingsPanelContext = createContext<SettingsPanelContext | null>(null);

function useSettingsPanel() {
  const context = useContext(SettingsPanelContext);
  if (!context) {
    throw new Error(
      "useSettingsPanel must be used within a SettingsPanelProvider.",
    );
  }
  return context;
}

const SettingsPanelProvider = ({
  children,
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  style,
  className,
  ...props
}: SettingsPanelProviderProps) => {
  const { isMobile } = useMobile();
  const [openMobile, setOpenMobile] = useState(false);

  const [_open, _setOpen] = useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
      document.cookie = `${SETTINGS_COOKIE_NAME}=${openState}; path=/; max-age=${SETTINGS_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  const togglePanel = useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SETTINGS_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        togglePanel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePanel]);

  const state = open ? "expanded" : "collapsed";

  const contextValue = useMemo<SettingsPanelContext>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      togglePanel,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, togglePanel],
  );

  return (
    <SettingsPanelContext.Provider value={contextValue}>
      <div
        style={
          {
            "--settings-width": SETTINGS_WIDTH,
            "--settings-width-icon": SETTINGS_WIDTH_ICON,
            ...style,
          } as CSSProperties
        }
        className={cn("group/settings-wrapper flex w-full", className)}
        {...props}
      >
        {children}
      </div>
    </SettingsPanelContext.Provider>
  );
};
SettingsPanelProvider.displayName = "SettingsPanelProvider";

interface SettingsPanelProps extends ComponentProps<"div"> {
  side: "left" | "right";
}

const SettingsPanel = ({
  className,
  children,
  side = "right",
  ...props
}: SettingsPanelProps) => {
  const {
    isMobile,
    openMobile,
    setOpenMobile,
    open,
    togglePanel,
    collapsible,
    state,
  } = useSettingsPanel();

  if (collapsible === "none") {
    return (
      <div
        className={cn(
          "flex h-full w-(--settings-width) flex-col bg-fade text-sidebar-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          className={cn("w-72 px-4 md:px-6 py-0 bg-fade [&>button]:hidden")}
          style={
            {
              "--settings-width": SETTINGS_WIDTH_MOBILE,
            } as CSSProperties
          }
        >
          <SheetTitle className="hidden">Settings</SheetTitle>
          <div className="flex h-full w-full flex-col">
            <SettingsPanelContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <ScrollArea>
      {!open && (
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 z-100"
          onClick={togglePanel}
        >
          <Icon name="plus" className="size-4" />
        </Button>
      )}
      <div
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-side={side}
        className={cn(
          "px-4 md:px-6 bg-fade group peer hidden md:block text-sidebar-foreground",
        )}
      >
        <div
          data-settings="settings"
          className={cn(
            "duration-300 relative h-svh w-(--settings-width) bg-transparent transition-[width] ease-in-out",
            "group-data-[collapsible=offcanvas]:w-0",
          )}
        >
          <SettingsPanelContent />
        </div>
      </div>
    </ScrollArea>
  );
};
SettingsPanel.displayName = "SettingsPanel";

const SettingsPanelContent = () => {
  const id = useId();
  const { togglePanel } = useSettingsPanel();

  return (
    <>
      {/* Sidebar header */}
      <div className="h-16 flex items-center justify-between relative before:absolute before:inset-x-0 before:top-0 before:h-[0.5px] before:bg-gradient-to-r before:from-black/[0.06] before:via-black/10 before:to-black/[0.06]">
        <div className="flex items-center gap-2">
          <Icon
            name="wave-sine-thin"
            aria-hidden="true"
            className="text-muted-foreground/70"
          />
          <h2 className="text-sm font-medium">Preferences</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={togglePanel}
          >
            <Icon name="slash" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Sidebar content */}
      <div className="-mt-px">
        {/* Content group */}
        <div className="py-5 relative before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-black/[0.06] before:via-black/10 before:to-black/[0.06]">
          <h3 className="text-xs font-medium uppercase text-muted-foreground/80 mb-4">
            Chat presets
          </h3>
          <div className="space-y-3">
            {/* Model */}
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`${id}-model`} className="font-normal">
                Model
              </Label>
              <Select defaultValue="1">
                <SelectTrigger
                  id={`${id}-model`}
                  className="bg-background w-auto max-w-full h-7 py-1 px-2 gap-1 [&_svg]:-me-1 border-none"
                >
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent
                  className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2"
                  align="end"
                >
                  <SelectItem value="1">Chat 4.0</SelectItem>
                  <SelectItem value="2">Chat 3.5</SelectItem>
                  <SelectItem value="3">Chat 3.0</SelectItem>
                  <SelectItem value="4">Chat 2.5</SelectItem>
                  <SelectItem value="5">Chat 2.0</SelectItem>
                  <SelectItem value="6">Chat 1.5</SelectItem>
                  <SelectItem value="7">Chat 1.0</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Response format */}
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`${id}-response-format`} className="font-normal">
                Response format
              </Label>
              <Select defaultValue="1">
                <SelectTrigger
                  id={`${id}-response-format`}
                  className="bg-background w-auto max-w-full h-7 py-1 px-2 gap-1 [&_svg]:-me-1 border-none"
                >
                  <SelectValue placeholder="Select response format" />
                </SelectTrigger>
                <SelectContent
                  className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2"
                  align="end"
                >
                  <SelectItem value="1">text</SelectItem>
                  <SelectItem value="2">json_object</SelectItem>
                  <SelectItem value="3">json_schema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Writing style */}
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`${id}-writing-style`} className="font-normal">
                Writing style
              </Label>
              <Select defaultValue="1">
                <SelectTrigger
                  id={`${id}-writing-style`}
                  className="bg-background w-auto max-w-full h-7 py-1 px-2 gap-1 [&_svg]:-me-1 border-none"
                >
                  <SelectValue placeholder="Select writing style" />
                </SelectTrigger>
                <SelectContent
                  className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2"
                  align="end"
                >
                  <SelectItem value="1">Concise</SelectItem>
                  <SelectItem value="2">Formal</SelectItem>
                  <SelectItem value="3">Technical</SelectItem>
                  <SelectItem value="4">Creative</SelectItem>
                  <SelectItem value="5">Scientific</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mode */}
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`${id}-mode`} className="font-normal">
                Mode
              </Label>
              <Select defaultValue="1">
                <SelectTrigger
                  id={`${id}-mode`}
                  className="bg-background w-auto max-w-full h-7 py-1 px-2 gap-1 [&_svg]:-me-1 border-none"
                >
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent
                  className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2"
                  align="end"
                >
                  <SelectItem value="1">Chatbot</SelectItem>
                  <SelectItem value="2">Code</SelectItem>
                  <SelectItem value="3">Translate</SelectItem>
                  <SelectItem value="4">Summarize</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content group */}
        <div className="py-5 relative before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-black/[0.06] before:via-black/10 before:to-black/[0.06]">
          <h3 className="text-xs font-medium uppercase text-muted-foreground/80 mb-4">
            Configurations
          </h3>
          <div className="space-y-3">
            {/* Temperature */}
            <SliderControl
              minValue={0}
              maxValue={2}
              initialValue={[1.25]}
              defaultValue={[1]}
              step={0.01}
              label="Temperature"
            />

            {/* Maximum length */}
            <SliderControl
              className="[&_input]:w-14"
              minValue={1}
              maxValue={16383}
              initialValue={[2048]}
              defaultValue={[2048]}
              step={1}
              label="Maximum length"
            />

            {/* Top P */}
            <SliderControl
              minValue={0}
              maxValue={1}
              initialValue={[0.5]}
              defaultValue={[0]}
              step={0.01}
              label="Top P"
            />
          </div>
        </div>
      </div>
    </>
  );
};
SettingsPanelContent.displayName = "SettingsPanelContent";

const SettingsPanelTrigger = ({
  onClick,
}: {
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}) => {
  const { isMobile, togglePanel } = useSettingsPanel();

  if (!isMobile) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      className="px-2"
      onClick={(event) => {
        onClick?.(event);
        togglePanel();
      }}
    >
      <Icon
        name="slash"
        className="text-muted-foreground sm:text-muted-foreground/70 size-5"
        aria-hidden="true"
      />
      <span className="max-sm:sr-only">Settings</span>
    </Button>
  );
};
SettingsPanelTrigger.displayName = "SettingsPanelTrigger";

export {
  SettingsPanel,
  SettingsPanelProvider,
  SettingsPanelTrigger,
  useSettingsPanel,
};
