# Synchronizing timing

Timing information can also be returned by the API to synchronize speech with other modalities (e.g., text, video) and is available for both standard and streaming requests. Each punctuation sequence and word is associated with a start time and duration (in seconds), which can be used to determine when the text is spoken and how long it lasts. This can be useful for creating captions, subtitles, or aligning speech with other media.

## Standard Example

This code sample uses the `return_durations` option with the `generate_detailed` method to fetch timing information and print out its content.

*Code:*

<CodeGroup>
  ```python Python
  import asyncio
  from lmnt import AsyncLmnt

  async def main():
    client = AsyncLmnt()
    response = await client.speech.generate_detailed(
      text='Hello world',
      voice='lily',
      return_durations=True,
    )
    for chunk in response.durations:
      print(f'"{chunk.text}" starts at {chunk.start:.3f}s and lasts for {chunk.duration:.3f}s')

  asyncio.run(main())
  ```
</CodeGroup>

*Response:*

```
"" starts at 0.000s and lasts for 0.525s
"Hello" starts at 0.525s and lasts for 0.325s
" " starts at 0.850s and lasts for 0.000s
"world" starts at 0.850s and lasts for 0.400s
"." starts at 1.250s and lasts for 0.375s
"" starts at 1.625s and lasts for 0.013s
```

## Speech session example

The code below depicts how to fetch timing information in a speech session. It is a simple example, and in practice, you would want to set up reader/writer tasks to handle the text input and synthesis output concurrently (see our [Streaming example](/getting-started/streaming-example)).

*Input code:*

<Note>
  The option to return timing information in a speech session is called `return_extras`. This option name is different from standard requests, where it's called `return_durations`.
</Note>

<CodeGroup>
  ```python Python
  import asyncio
  from lmnt import AsyncLmnt

  async def main():
    client = AsyncLmnt()
    connection = await client.speech.sessions.create(voice='lily', return_extras=True)
    await connection.append_text('Hello world.')
    await connection.finish()
    async for message in connection:
      for chunk in message.durations:
        print(f'"{chunk.text}" starts at {chunk.start:.3f}s and lasts for {chunk.duration:.3f}s')

  asyncio.run(main())
  ```

  ```javascript JavaScript
  const Lmnt = require('lmnt-node');

  const main = async () => {
    const lmnt = new Lmnt({ apiKey: process.env['LMNT_API_KEY'] });
    const params = { voice: 'lily', return_extras: true };
    const speechConnection = await lmnt.speech.sessions.create(params);
    speechConnection.appendText('Hello world.');
    speechConnection.finish();
    for await (const message of speechConnection) {
      for (const chunk of message.durations) {
        console.log(`"${chunk.text}" starts at ${chunk.start.toFixed(3)}s and lasts for ${chunk.duration.toFixed(3)}s`);
      }
    }
  };

  main();
  ```
</CodeGroup>

*Output response:*

```
"" starts at 0.000s and lasts for 0.525s
"Hello" starts at 0.525s and lasts for 0.325s
" " starts at 0.850s and lasts for 0.000s
"world" starts at 0.850s and lasts for 0.400s
"." starts at 1.250s and lasts for 0.375s
"" starts at 1.625s and lasts for 0.013s
```
