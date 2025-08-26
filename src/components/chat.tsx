"use client";

import {
  SettingsPanelTrigger,
  useSettingsPanel,
} from "@/components/settings-panel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef, useEffect } from "react";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./chat-message";

export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { state } = useSettingsPanel();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [state]);

  return (
    <ScrollArea className={cn("relative h-full w-full")}>
      <div className="h-full flex flex-grow flex-col">
        {/* Header */}
        <div className="sticky top-0 z-100 bg-background before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-gradient-to-r before:from-black/[0.06] before:via-black/10 before:to-black/[0.06]">
          <div className="py-5 px-4 md:px-6 lg:px-6 flex bg-fade/40 items-center justify-between gap-2">
            <Breadcrumb>
              <BreadcrumbList className="sm:gap-1.5">
                <BreadcrumbItem>
                  <p className="text-foreground/55 font-light tracking-tight text-base">
                    Chat
                  </p>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div
              className={cn(
                "flex items-center gap-2 -my-2 -me-2",
                "transition-transform duration-[300ms] translate-x-0",
                {
                  "-translate-x-[3.25rem]": state === "collapsed",
                },
              )}
            >
              <Button
                variant="ghost"
                className="text-base font-normal tracking-tighter text-foreground"
              >
                <span className="max-sm:sr-only">Review</span>
              </Button>
              <Button
                variant="ghost"
                className="text-base font-light tracking-tight text-foreground"
              >
                <span className="max-sm:sr-only">Build</span>
              </Button>
              <Button
                variant="ghost"
                className="text-base font-light tracking-tight text-foreground"
              >
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
              <div className="inline-flex items-center bg-background rounded-full border border-foreground/20 shadow-xs text-xs font-medium py-1.5 px-3 text-foreground/70">
                <Icon
                  name="px-clock"
                  className="me-1.5 text-foreground/30 -ms-1"
                />
                Today
              </div>
            </div>
            <ChatMessage>
              <p>
                AI agents are software that perceive their environment and act
                autonomously to achieve goals, making decisions, learning, and
                interacting. For example, an AI agent might schedule meetings by
                resolving conflicts, contacting participants, and finding
                optimal times—all without constant supervision.
              </p>
              <p>Let me know if you&lsquo;d like more details!</p>
            </ChatMessage>
            <ChatMessage isUser>
              <p>All clear, thank you!</p>
            </ChatMessage>
            <ChatMessage>
              <p>
                AI agents are software that perceive their environment and act
                autonomously to achieve goals, making decisions, learning, and
                interacting. For example, an AI agent might schedule meetings by
                resolving conflicts, contacting participants, and finding
                optimal times—all without constant supervision.
              </p>
              <p>Let me know if you&lsquo;d like more details!</p>
            </ChatMessage>
            <ChatMessage isUser>
              <p>All clear, thank you!</p>
            </ChatMessage>
            <ChatMessage>
              <p>
                AI agents are software that perceive their environment and act
                autonomously to achieve goals, making decisions, learning, and
                interacting. For example, an AI agent might schedule meetings by
                resolving conflicts, contacting participants, and finding
                optimal times—all without constant supervision.
              </p>
              <p>Let me know if you&lsquo;d like more details!</p>
            </ChatMessage>
            <ChatMessage isUser>
              <p>All clear, thank you!</p>
            </ChatMessage>
            <ChatMessage>
              <p>
                AI agents are software that perceive their environment and act
                autonomously to achieve goals, making decisions, learning, and
                interacting. For example, an AI agent might schedule meetings by
                resolving conflicts, contacting participants, and finding
                optimal times—all without constant supervision.
              </p>
              <p>Let me know if you&lsquo;d like more details!</p>
            </ChatMessage>
            <ChatMessage isUser>
              <p>All clear, thank you!</p>
            </ChatMessage>
            <div ref={messagesEndRef} className="h-full flex flex-col" />
          </div>
        </div>
        {/* Footer */}
        <div className="sticky bottom-0 pt-4 md:pt-8 z-50">
          <div className="max-w-3xl mx-auto rounded-2xl pb-4 md:pb-8">
            <div className="relative rounded-[1.25rem] bg-background border-[0.5px] dark:border-foreground/25 transition-colors focus-within:bg-background/80 focus-within:border-input has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 [&:has(input:is(:disabled))_*]:pointer-events-none">
              <textarea
                className="flex h-16 w-full bg-transparent px-4 py-3 leading-relaxed text-foreground placeholder:text-foreground/55 font-light focus-visible:outline-none [resize:none] tracking-tight"
                placeholder="Ask me anything..."
                aria-label="Enter your prompt"
              />
              {/* Textarea buttons */}
              <div className="flex items-center justify-between gap-2 pb-2.5 px-3">
                {/* Left buttons */}
                <div className="flex items-center gap-2.5">
                  <Button
                    size="icon"
                    variant="outline"
                    className={cn(
                      "rounded-lg size-8 border-[0.8px] border-foreground/15 hover:border-foreground/25 bg-fade/40 hover:shadow-xs transition-[box-shadow]",
                    )}
                  >
                    <Icon name="plus" className="text-foreground size-3.5" />
                    <span className="sr-only">Attach</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-lg size-8 border-[0.8px] border-foreground/15 hover:border-foreground/25 hover:bg-background hover:shadow-xs transition-[box-shadow]"
                  >
                    <Icon name="slashes" className="text-foreground size-3.5" />

                    <span className="sr-only">Audio</span>
                  </Button>
                </div>
                {/* Right buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-2xl size-8 border-none hover:bg-background hover:shadow-md transition-[box-shadow]"
                  >
                    <span className="sr-only">Generate</span>
                  </Button>
                  <Button
                    className={cn(
                      "rounded-lg size-8 border-[0.8px] border-foreground/15 hover:border-foreground/25 text-foreground hover:shadow-xs transition-[box-shadow]",
                      " bg-fade hover:bg-fade/70",
                      "relative after:rounded-[inherit] after:absolute after:inset-0 after:shadow-[0_0_1px_0_rgb(0_0_0/.05),inset_0.4px_0.8px_0.0px_0.0_rgb(255_255_255/.35)] after:pointer-events-none",
                    )}
                  >
                    <Icon name="px-arrow-up" />
                  </Button>
                  {/*
                   */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
