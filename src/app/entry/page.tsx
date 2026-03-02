import {getEviConfig} from '@/lib/hume/get-evi-config'
import {Content} from './content'

const Page = async () => {
  let config: {configId: string; accessToken?: string} | null = null
  try {
    config = await getEviConfig()
  } catch {
    // Config missing or env not set
  }
  return <Content config={config} />
}
export default Page
