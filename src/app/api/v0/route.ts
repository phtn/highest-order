import { NextRequest, NextResponse } from "next/server";
import { v0 } from "v0-sdk";

export async function POST(request: NextRequest) {
  try {
    const { message, chatId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    let chat;

    if (chatId) {
      // continue existing chat
      chat = await v0.chats.sendMessage({
        chatId: chatId,
        message,
        responseMode: 'sync',
      });
    } else {
      // create new chat
      chat = await v0.chats.create({
        message,
      });
    }

    // Type guard to ensure chat is ChatDetail, not a stream
    if ('id' in chat && 'demo' in chat) {
      return NextResponse.json({
        id: chat.id,
        demo: chat.demo,
      });
    }

    // If it's a stream (shouldn't happen with responseMode: 'sync', but TypeScript needs this)
    return NextResponse.json(
      { error: 'Unexpected stream response' },
      { status: 500 },
    );
  } catch (error) {
    console.error("V0 API Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
