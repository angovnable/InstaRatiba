// ============================================================
// src/hooks/index.ts — barrel export for all hooks
// ============================================================

export { useAuth }         from './useAuth'
export { useOnlineStatus } from './useOnlineStatus'
export { useToast }        from './useToast'
export { usePwaSync }      from './usePwaSync'
export { usePwaInstall }   from './usePwaInstall'

export type { SyncState }     from './usePwaSync'
export type { InstallStatus } from './usePwaInstall'
