import type { IpqaNodeOverview } from '@/features/ipqa/types'
import { ref } from 'vue'
import { fetchFleetOverview } from '@/features/ipqa/services/api'

const OK_TTL = 5 * 60 * 1000
const FAIL_TTL = 60 * 1000

const byUuid = ref<Record<string, IpqaNodeOverview>>({})
let inflight: Promise<void> | null = null
let lastAttempt = 0
let lastOk = false

async function load(): Promise<void> {
  if (inflight)
    return inflight
  if (lastAttempt && Date.now() - lastAttempt < (lastOk ? OK_TTL : FAIL_TTL))
    return

  inflight = (async () => {
    try {
      const data = (await fetchFleetOverview()) as unknown
      const list = (Array.isArray(data) ? data : ((data as any)?.nodes ?? [])) as IpqaNodeOverview[]
      const map: Record<string, IpqaNodeOverview> = {}
      for (const item of list) {
        if (item?.uuid)
          map[item.uuid] = item
      }
      byUuid.value = map
      lastOk = true
    }
    catch {
      // 未安装插件或请求失败：静默，首页保持原样
      lastOk = false
    }
    finally {
      lastAttempt = Date.now()
      inflight = null
    }
  })()
  return inflight
}

export function useIpqaHomeSummary() {
  void load()
  return { byUuid }
}