"use client";

import {
  SettingsPanelTrigger,
  useSettingsPanel,
} from "@/components/settings-panel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef, useEffect } from "react";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { state } = useSettingsPanel();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, []);

  return (
    <ScrollArea className="flex-1 [&>div>div]:h-full w-full shadow-md border-r-[0.5px] border-black/[0.14] md:rounded-tr-md min-[1024px]:rounded-e-3xl bg-background">
      <div className="h-full flex flex-col px-4 md:px-6 lg:px-6">
        {/* Header */}
        <div className="py-5 sticky top-0 z-10 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-gradient-to-r before:from-black/[0.06] before:via-black/10 before:to-black/[0.06]">
          <div className="flex items-center justify-between gap-2">
            <Breadcrumb>
              <BreadcrumbList className="sm:gap-1.5">
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Canvas</BreadcrumbLink>
                </BreadcrumbItem>
                <Icon name="px-close" className="rotate-90" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Design</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div
              className={cn(
                "flex items-center gap-1 -my-2 -me-2",
                "transition-transform duration-[300ms] translate-x-0",
                {
                  "-translate-x-[3.25rem]": state === "collapsed",
                },
              )}
            >
              <Button variant="ghost" className="px-2">
                <Icon name="px-code" className="text-muted-foreground" />
                <span className="max-sm:sr-only">Review</span>
              </Button>
              <Button variant="ghost" className="px-2">
                <Icon name="px-close" className="text-muted-foreground" />
                <span className="max-sm:sr-only">Build</span>
              </Button>
              <Button variant="ghost" className="px-2">
                <Icon name="px-check" className="text-muted-foreground" />
                <span className="max-sm:sr-only">Deploy</span>
              </Button>
              <SettingsPanelTrigger />
            </div>
          </div>
        </div>
        {/* Chat */}
        <div className="relative grow">
          <div className="max-w-3xl mx-auto mt-6 space-y-6">
            <div className="text-center my-8">
              <div className="inline-flex items-center bg-white rounded-full border border-black/[0.1] shadow-xs text-xs font-medium py-1 px-3 text-foreground/80">
                <Icon
                  name="px-clock"
                  className="me-1.5 text-muted-foreground/80 -ms-1"
                />
                Today
              </div>
            </div>

            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
        </div>
        {/* Footer */}
        <div className="sticky bottom-0 pt-4 md:pt-8 z-50">
          <div className="max-w-3xl mx-auto bg-background rounded-[20px] pb-4 md:pb-8">
            <div className="relative rounded-[20px] border border-transparent bg-muted transition-colors focus-within:bg-muted/50 focus-within:border-input has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 [&:has(input:is(:disabled))_*]:pointer-events-none">
              <textarea
                className="flex sm:min-h-[84px] w-full bg-transparent px-4 py-3 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none [resize:none]"
                placeholder="Ask me anything..."
                aria-label="Enter your prompt"
              />
              {/* Textarea buttons */}
              <div className="flex items-center justify-between gap-2 p-3">
                {/* Left buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full size-8 border-none hover:bg-background hover:shadow-md transition-[box-shadow]"
                  >
                    <Icon
                      name="px-dollar"
                      className="text-muted-foreground/70 size-5"
                    />
                    <span className="sr-only">Attach</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full size-8 border-none hover:bg-background hover:shadow-md transition-[box-shadow]"
                  >
                    <Icon
                      name="px-download"
                      className="text-muted-foreground/70 size-5"
                    />
                    <span className="sr-only">Audio</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full size-8 border-none hover:bg-background hover:shadow-md transition-[box-shadow]"
                  >
                    <Icon
                      name="px-zap"
                      className="text-muted-foreground/70 size-5"
                    />
                    <span className="sr-only">Action</span>
                  </Button>
                </div>
                {/* Right buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full size-8 border-none hover:bg-background hover:shadow-md transition-[box-shadow]"
                  >
                    <span className="sr-only">Generate</span>
                  </Button>
                  <Button className="rounded-full aspect-square size-8">
                    <Icon name="px-arrow-up" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
