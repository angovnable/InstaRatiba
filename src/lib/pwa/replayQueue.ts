// ============================================================
// InstaRatiba — src/lib/pwa/replayQueue.ts
// Replays IndexedDB-queued mutations against Supabase once
// the browser regains network connectivity.
// Called by usePwaSync.ts on 'online' event.
// ============================================================

import { supabase }                       from '@/lib/supabase'
import { getQueue, dequeue, incrementRetry } from './syncQueue'
import type { QueuedMutation }             from './syncQueue'

const MAX_RETRIES = 3

// ── Replay a single mutation ──────────────────────────────────
async function replay(mutation: QueuedMutation): Promise<boolean> {
  try {
    if (mutation.type === 'upsert' && mutation.table) {
      const { error } = await supabase
        .from(mutation.table as string)
        .upsert(mutation.payload as Record<string, unknown>)
      if (error) throw error
    }

    else if (mutation.type === 'delete' && mutation.table && mutation.filter) {
      let query = supabase.from(mutation.table as string).delete()
      for (const [col, val] of Object.entries(mutation.filter)) {
        // @ts-ignore dynamic column filter
        query = query.eq(col, val)
      }
      const { error } = await query
      if (error) throw error
    }

    else if (mutation.type === 'rpc' && mutation.rpcName) {
      const { error } = await supabase.rpc(
        mutation.rpcName as string,
        mutation.rpcArgs as Record<string, unknown>,
      )
      if (error) throw error
    }

    return true
  } catch (err) {
    console.warn('[InstaRatiba sync] Replay failed for', mutation.id, err)
    return false
  }
}

// ── Replay all pending mutations in order ─────────────────────
export async function replayQueue(
  onProgress?: (done: number, total: number, label: string) => void,
): Promise<{ succeeded: number; failed: number }> {
  const queue = await getQueue()
  if (queue.length === 0) return { succeeded: 0, failed: 0 }

  let succeeded = 0
  let failed    = 0

  for (let i = 0; i < queue.length; i++) {
    const mutation = queue[i]
    onProgress?.(i, queue.length, mutation.label)

    if (mutation.retryCount >= MAX_RETRIES) {
      // Give up — dequeue to avoid blocking future syncs
      await dequeue(mutation.id)
      failed++
      console.error('[InstaRatiba sync] Dropping mutation after max retries:', mutation)
      continue
    }

    const ok = await replay(mutation)
    if (ok) {
      await dequeue(mutation.id)
      succeeded++
    } else {
      await incrementRetry(mutation.id)
      failed++
    }
  }

  onProgress?.(queue.length, queue.length, 'Done')
  return { succeeded, failed }
}
