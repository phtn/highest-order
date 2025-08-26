"use client";

import { Message, MessageContent } from "@/components/ai-elements/message";
import { useChat } from "@ai-sdk/react";
import { Response } from "@/components/ai-elements/response";

const Example = () => {
  const { messages } = useChat();

  return (
    <>
      {messages.map(({ role, parts }, index) => (
        <Message from={role} key={index}>
          <MessageContent>
            {parts.map((part, i) => {
              switch (part.type) {
                case "text":
                  return <Response key={`${role}-${i}`}>{part.text}</Response>;
              }
            })}
          </MessageContent>
        </Message>
      ))}
    </>
  );
};

export default Example;
