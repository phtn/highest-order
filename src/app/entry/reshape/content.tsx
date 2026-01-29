'use client'

import {ex_async} from '@/components/code/config'
import {createEditor} from '@/components/code/editor'
import {Wrapper} from '@/components/wrapper'
import {cn} from '@/lib/utils'
import MonacoType from 'monaco-editor-core'
import {useEffect, useRef, useState} from 'react'

export const Content = ({children}: {children: React.ReactNode}) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] =
    useState<MonacoType.editor.IStandaloneCodeEditor | null>(null)

  const [input] = useState(ex_async)

  useEffect(() => {
    let mounted = true
    if (input)
      (async () => {
        const ed = await createEditor(input, 'typescript', elementRef)
        if (mounted && ed) {
          setEditor(ed)
        }
      })()
    return () => {
      mounted = false
      if (editor) {
        editor.dispose()
      }
    }
  }, [])

  const [output, setOutput] = useState('')

  useEffect(() => {
    if (input) {
      setOutput(input)
      // call api
      // to_ts(input).then(setOutput).catch(console.error);
    }
  }, [input])

  return (
    <Wrapper>
      <div>
        <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800'>
          <div className='flex h-10 items-center space-x-4 px-2'>
            <h3 className='text-xl tracking-tight font-bold text-gray-900 dark:text-gray-100'>
              Reshape
            </h3>
          </div>

          <div className='flex items-center space-x-2'></div>
        </div>
        {/* Theme toggle */}

        <div
          className='overflow-hidden flex'
          style={{maxHeight: 'h-[60vh] text-sm'}}>
          <div className={cn('relative flex flex-col w-full overflow-hidden')}>
            <div className=' pl-5 py-1.5 leading-none flex items-center text-sm opacity-70 bg-fade/80 border-y-[0.5px] border-foreground/10 text-foreground'>
              <span className='font-mono relative -top-px'>payload.json</span>
            </div>
            {/*<div ref={elementRef} className='scroll-smooth antialiased h-144' />*/}
          </div>

          {/*<CodeBlock
            className='h-144'
            code={`{ "this": ${output} }`}
            language='tsx'
          />*/}
        </div>

        <div>{children}</div>
      </div>
    </Wrapper>
  )
}
