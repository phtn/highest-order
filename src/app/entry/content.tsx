"use client";

import Chat from "@/components/chat";
import { Wrapper } from "@/components/wrapper";
import { Convex } from "@/ctx/convex";

export const Content = () => {
  return (
    <Convex>
      <Wrapper>
        <Chat />
      </Wrapper>
    </Convex>
  );
};
