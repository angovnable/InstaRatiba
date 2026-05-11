import { toast } from 'sonner'

export function useToast() {
  return {
    success: (msg: string) => toast.success(msg),
    error:   (msg: string) => toast.error(msg),
    warn:    (msg: string) => toast.warning(msg),
    info:    (msg: string) => toast.info(msg),
    loading: (msg: string) => toast.loading(msg),
    dismiss: (id?: string | number) => toast.dismiss(id),
  }
}
