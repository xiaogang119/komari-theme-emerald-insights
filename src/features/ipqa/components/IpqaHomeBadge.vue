<script setup lang="ts">
import { computed } from 'vue'
import { useIpqaHomeSummary } from '@/composables/useIpqaHomeSummary'
import { getRiskColor, getRiskLabel } from '../formatters'
import { findProtocolOverviewService } from '../overviewSelectors'

const props = defineProps<{ uuid: string }>()
const { byUuid } = useIpqaHomeSummary()

const node = computed(() => byUuid.value[props.uuid])
const hasArchive = computed(() => !!node.value && (node.value.has_ipv4 || node.value.has_ipv6))
const version = computed<'v4' | 'v6'>(() => (node.value?.has_ipv4 ? 'v4' : 'v6'))

const risk = computed(() => {
  const n = node.value
  if (!n)
    return null
  return (version.value === 'v4' ? n.v4?.risk : n.v6?.risk) ?? n.highest_risk
})
const riskColors = computed(() => (risk.value ? getRiskColor(risk.value.category) : null))

// 首页卡片空间小，只挑常用的几项。想增减就改这个数组
const SERVICES: { label: string, kind: 'media' | 'ai', names: string[] }[] = [
  { label: 'YouTube', kind: 'media', names: ['YouTube', 'Youtube'] },
  { label: 'Netflix', kind: 'media', names: ['Netflix'] },
  { label: 'TikTok', kind: 'media', names: ['TikTok', 'tiktok'] },
  { label: 'GPT', kind: 'ai', names: ['ChatGPT', 'chatgpt', 'OpenAI'] },
]

const chips = computed(() => {
  const n = node.value
  const result: { label: string, badgeClass: any, title: string }[] = []
  if (!n)
    return result
  for (const s of SERVICES) {
    const r = findProtocolOverviewService(n, version.value, s.names, s.kind)
    if (r.available)
      result.push({ label: s.label, badgeClass: r.badgeClass, title: r.label })
  }
  return result
})
</script>

<template>
  <div v-if="hasArchive && risk && riskColors" class="flex items-center justify-between gap-2">
    <span class="truncate shrink-0">质量</span>
    <div class="border-t-2 border-dotted border-gray-500/10 mx-2 flex-1" />
    <div class="flex min-w-0 flex-wrap items-center justify-end gap-1">
      <span
        class="inline-flex items-center gap-1 rounded border px-1.5 py-px text-[10px] font-medium"
        :class="[riskColors.bg, riskColors.text, riskColors.border]"
        :title="`风控评级（${risk.source}）`"
      >
        <span class="size-1.5 rounded-full" :class="riskColors.dot" />
        {{ getRiskLabel(risk.category) }}
      </span>
      <span
        v-for="c in chips"
        :key="c.label"
        class="rounded px-1 py-px text-[10px] font-medium"
        :class="c.badgeClass"
        :title="c.title"
      >
        {{ c.label }}
      </span>
    </div>
  </div>
</template>