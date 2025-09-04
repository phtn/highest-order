"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useChatSettings } from "@/ctx/chat/store";
import { useVoiceSettings } from "@/ctx/voice/store";
import { useConversations } from "@/ctx/chat/conversations";
import { Response } from "@/components/ai-elements/response";
import { SettingsPanelTrigger } from "@/components/settings-panel";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/source";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Loader } from "@/components/ai-elements/loader";

import { Wrapper } from "@/components/wrapper";

export default function ElleComp() {
  const [input, setInput] = useState("");
  const { model, webSearch, speechEnabled } = useChatSettings();
  const { voice } = useVoiceSettings();
  const {
    currentId,
    getCurrentMessages,
    setCurrentMessages,
    createConversation,
    renameConversation,
  } = useConversations();

  const { messages, sendMessage, status, setMessages } = useChat({
    id: currentId || "default",
  });

  const assistantLabel = useCallback(
    (alias: string) => (alias.toLowerCase() === "sakura" ? "Sakura" : "Ellie"),
    [],
  );

  const extractTextFromParts = (parts: unknown[]) => {
    let text = "";
    for (const p of parts) {
      const part = p as unknown as { type: string; text?: string };
      if (part.type === "text" && typeof part.text === "string") {
        text += part.text;
      }
    }
    return text;
  };

  // Simple speech synthesis
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const assistantTextRef = useRef<string>("");
  const hydratingRef = useRef<boolean>(true);
  const prevCountRef = useRef<number>(0);

  const playAudio = useCallback(
    async (text: string) => {
      if (!speechEnabled || !text || text.trim().length === 0) return;

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text, voice }),
        });

        if (!res.ok) return;

        const arr = await res.arrayBuffer();

        // Clean up previous audio
        if (currentAudioUrlRef.current) {
          URL.revokeObjectURL(currentAudioUrlRef.current);
        }
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeAttribute("src");
        }

        const blob = new Blob([arr], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        currentAudioUrlRef.current = url;

        const audio = audioRef.current;
        if (audio) {
          audio.src = url;
          audio.volume = 1;
          audio.muted = false;

          audio.oncanplay = () => {
            void audio.play();
          };

          audio.onended = () => {
            URL.revokeObjectURL(url);
            currentAudioUrlRef.current = null;
          };

          audio.onerror = () => {
            URL.revokeObjectURL(url);
            currentAudioUrlRef.current = null;
          };
        }
      } catch {
        // Ignore errors
      }
    },
    [voice, speechEnabled],
  );

  // Stop audio when speech is disabled
  useEffect(() => {
    if (!speechEnabled) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
      }
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }
    }
  }, [speechEnabled]);

  // Hydrate from conversation store and on conversation change without replaying TTS
  useEffect(() => {
    // gate side-effects during conversation selection hydration
    hydratingRef.current = true;
    // create a conversation if none exists yet
    if (!currentId) {
      const name = assistantLabel(voice);
      createConversation(name);
      // lift hydrating gate even on early return so other effects resume
      hydratingRef.current = false;
      return;
    }
    try {
      const saved = getCurrentMessages();
      // Always replace the view with the selected conversation's messages
      assistantTextRef.current = "";
      setMessages(saved);
      prevCountRef.current = saved.length;
    } catch {
      // ignore
    } finally {
      hydratingRef.current = false;
    }
  }, [
    currentId,
    voice,
    assistantLabel,
    createConversation,
    getCurrentMessages,
    setMessages,
  ]);

  // Play TTS when assistant message is complete
  useEffect(() => {
    if (!speechEnabled || hydratingRef.current) return;

    // Find the latest assistant message
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAssistant) {
      assistantTextRef.current = "";
      return;
    }

    // Concatenate all text parts from the assistant message
    const fullText = extractTextFromParts(lastAssistant.parts);

    // If this is a new message or the message has changed, play it
    if (fullText !== assistantTextRef.current) {
      assistantTextRef.current = fullText;

      // Only play when streaming is finished to avoid interrupting
      if (status !== "streaming" && fullText.trim().length > 0) {
        void playAudio(fullText);
      }
    }
  }, [messages, status, speechEnabled, playAudio]);

  // persist chat messages to current conversation
  useEffect(() => {
    if (hydratingRef.current) return;
    try {
      setCurrentMessages(messages);
    } catch {
      // ignore
    }
  }, [messages, setCurrentMessages]);

  // Derive a conversation title from the first user message when a conversation starts
  useEffect(() => {
    if (!currentId || hydratingRef.current) return;
    const prev = prevCountRef.current;
    const curr = messages.length;
    // If conversation had no messages before and now has some, derive a title
    if (prev === 0 && curr > 0) {
      const firstUser = messages.find((m) => m.role === "user");
      if (firstUser) {
        const text = extractTextFromParts(firstUser.parts);
        const title = (text.trim().slice(0, 50) || "New conversation").replace(
          /\s+/g,
          " ",
        );
        try {
          renameConversation(currentId, title);
        } catch {
          // ignore
        }
      }
    }
    prevCountRef.current = curr;
  }, [messages, currentId, renameConversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim()) {
      sendMessage(
        { text: input },
        {
          body: {
            model,
            webSearch,
          },
        },
      );
      setInput("");
    }
  };

  return (
    <Wrapper>
      <div className="max-w-4xl mx-auto p-6 relative size-full">
        <div className="flex flex-col h-full">
          <Conversation className="h-full">
            <ConversationContent>
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === "assistant" && (
                    <Sources>
                      <SourcesTrigger
                        count={
                          message.parts.filter(
                            (part) => part.type === "source-url",
                          ).length
                        }
                      />
                      {message.parts
                        .filter((part) => part.type === "source-url")
                        .map((part, i) => (
                          <SourcesContent key={`${message.id}-${i}`}>
                            <Source
                              href={part.url}
                              title={part.url}
                            />
                          </SourcesContent>
                        ))}
                    </Sources>
                  )}
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case "text":
                            return (
                              <Response key={`${message.id}-${i}`}>
                                {part.text}
                              </Response>
                            );
                          case "reasoning":
                            return (
                              <Reasoning
                                key={`${message.id}-${i}`}
                                className="w-full"
                                isStreaming={status === "streaming"}
                              >
                                <ReasoningTrigger />
                                <ReasoningContent>{part.text}</ReasoningContent>
                              </Reasoning>
                            );
                          default:
                            return null;
                        }
                      })}
                    </MessageContent>
                  </Message>
                </div>
              ))}
              {status === "submitted" && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          <PromptInput onSubmit={handleSubmit} className="mt-4">
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
            <PromptInputToolbar>
              <PromptInputTools>
                <SettingsPanelTrigger />
              </PromptInputTools>
              <PromptInputSubmit disabled={!input} status={status} />
            </PromptInputToolbar>
          </PromptInput>

          {/* Hidden audio element for queued playback */}
          <audio ref={audioRef} className="absolute opacity-0 w-0 h-0" />
        </div>
      </div>
    </Wrapper>
  );
}
