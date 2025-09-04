# LMNT Speech session example

> How to use the speech session API to stream text to the server and receive synthesized speech in real-time.

With LMNT, you can create a speech session, which is a websocket connection that enables full-duplex streaming.
This means that the client can simultaneously send text to the server while receiving synthesized speech as it's being generated.

This can be very useful in a variety of cases, including hosting customer support bots, virtual assistants, and live captioning and transcription.
Streaming minimizes the latency between input and output, providing a seamless and natural user experience.

## Setup

Below is an example of linking ChatGPT with our speech session API. Before starting:

1. Ensure you've completed the [Environment setup](/getting-started/environment-setup) section.
2. Since we're using OpenAI, you'll also need an OpenAI API key ([login](https://platform.openai.com/api-keys), click on `Create new secret key`, and copy key)

## Summary

Here is a summary of what the code below does.

1. Creates a speech session with the `sessions.create` method.
2. Sends text to the server using `appendText`/`append_text` and concurrently read synthesized speech from the server
3. The server buffers text and synthesizes speech when it has enough.
4. Repeats step 2 until you have no more text to send.
5. Calls `flush` or `finish` to tell server to synthesize speech for all the text it’s still buffered
6. Closes connection by calling `close`.

## Concurrent streaming

We'll use two tasks to handle the streaming data: one to read from ChatGPT and write to LMNT, and another to read from LMNT and write to a file.
Both of these tasks are asynchronous and run concurrently.

<CodeGroup>
  ```python Python
  import asyncio
  from lmnt import AsyncLmnt
  from openai import AsyncOpenAI

  DEFAULT_PROMPT = 'Read me an excerpt of a short sci-fi story in the public domain.'
  VOICE_ID = 'elowen'

  async def main():
    client = AsyncLmnt()
    connection = await client.speech.sessions.create(voice=VOICE_ID)
    t1 = asyncio.create_task(reader_task(connection))
    t2 = asyncio.create_task(writer_task(connection))
    await asyncio.gather(t1, t2)
    await connection.close()


  async def reader_task(connection):
    """Streams audio data from LMNT and writes it to `output.mp3`."""
    with open('output.mp3', 'wb') as f:
      async for message in connection:
        f.write(message.audio)


  async def writer_task(connection):
      """Streams text from ChatGPT to LMNT."""
      client = AsyncOpenAI()
      response = await client.chat.completions.create(
          model='gpt-4o-mini',
          messages=[{'role': 'user', 'content': DEFAULT_PROMPT}],
          stream=True)

      async for chunk in response:
          if (not chunk.choices[0] or
              not chunk.choices[0].delta or
              not chunk.choices[0].delta.content):
            continue
          content = chunk.choices[0].delta.content
          await connection.append_text(content)
          print(content, end='', flush=True)

      # After `finish` is called, the server will close the connection
      # when it has finished synthesizing.
      await connection.finish()


  asyncio.run(main())
  ```

  ```javascript JavaScript
  const Lmnt = require('lmnt-node');
  const OpenAI = require('openai').OpenAI;
  const { createWriteStream } = require('fs');

  const DEFAULT_PROMPT = 'Read me an excerpt of a short sci-fi story in the public domain.';
  const VOICE_ID = 'elowen';

  const main = async () => {
    const lmnt = new Lmnt({ apiKey: process.env['LMNT_API_KEY'] });
    const speechConnection = await lmnt.speech.sessions.create({
      voice: VOICE_ID
    });

    const openai = new OpenAI();
    const chatConnection = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: DEFAULT_PROMPT }],
      stream: true,
    });

    const writerTask = async () => {
      // Streams text from ChatGPT to LMNT.
      for await (const part of chatConnection) {
        const message = part.choices[0]?.delta?.content || '';
        await speechConnection.appendText(message);
        process.stdout.write(message);
      }

      // After `finish` is called, the server will close the connection
      // when it has finished synthesizing.
      await speechConnection.finish();
    };

    const readerTask = async () => {
      // Streams audio data from LMNT and writes it to `output.mp3`.
      const audioFile = createWriteStream('output.mp3');
      for await (const message of speechConnection) {
        audioFile.write(message.audio);
      }
    };

    await Promise.all([writerTask(), readerTask()]);
    await speechConnection.close();
  }

  main();
  ```
</CodeGroup>

## Server buffering

When text is sent to the LMNT servers via `appendText`, the server will not
synthesize any speech until enough text has been received. We do this to gather
as much context as possible so that we can generate more natural-sounding
speech. The emotion and style in which a portion of text is spoken can vary
according to the entire context of a sentence, so the server will wait for
additional text as appropriate. Once the server has enough text buffered, it
will synthesize speech segments and return them to you.

As a result, just sending text may not immediately yield speech. This is where
`flush` and `finish` come in.

### Flushing the server buffer

`flush` and `finish` are used to signal to the server that it should start
synthesizing speech with the text it has received so far. It tells the server to
not wait for any other text to fill out any additional speech context.

Let's say that you have some text you want synthesized, so you stream text to
the LMNT servers. If the server has not yet received enough text, it will buffer
the text and wait for more. Even if you are streaming enough text to get the
servers to start synthesizing speech and streaming it back to you, once you are
done sending text, the server will still retain some buffered text as it waits
for more. You must notify the server that you are done by sending either a
`flush` or a `finish` to receive that last chunk of speech.

### Flush vs Finish

So what's the difference between `flush` and `finish`?

`flush` and `finish` both signal to the server that it should synthesize all the
text it currently has. However, `finish` also signals to the server that it
should close the connection after it has finished synthesizing.

As a result, `flush` is critical in cases where you are momentarily done with
sending text and want speech returned to you, but you do not want the connection
closed yet. In applications where latency matters, you may not want to
repeatedly incur the latency cost of setting up a new websocket connection.
`flush` allows you to keep a connection open while controlling when the server
should synthesize its text.

Let's say that you are building a chatbot, and you implement it so that a single
connection is used throughout an entire conversation. When you want the bot to
speak, you send the text to LMNT and then call `flush` to force the server to
synthesize all of that text. The connection remains open, so the next time you
want to synthesize speech, you send more text to LMNT and call `flush` again. In
this scenario, you are ensuring that speech is returned to you as quickly as
possible.

Now consider the alternative, where you create a new connection for each message
and close the connection each time with `finish`. The chatbot would respond much
slower.

<Tip>
  Make sure you call either `flush` or `finish` at the end of your text stream to ensure the server synthesizes all the speech you expected.
</Tip>
