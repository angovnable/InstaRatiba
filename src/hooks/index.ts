// ============================================================
// src/hooks/index.ts — barrel export for all hooks
// ============================================================

export { useAuth }         from './useAuth'
export { useBootstrap }    from './useBootstrap'
export { useOnlineStatus } from './useOnlineStatus'
export { useToast }        from './useToast'
export { usePwaSync }      from './usePwaSync'
export { usePwaInstall }   from './usePwaInstall'
export { useStudentMarks } from './useStudentMarks'
export { useFinance }      from './useFinance'

export type { SyncState }     from './usePwaSync'
export type { InstallStatus } from './usePwaInstall'
