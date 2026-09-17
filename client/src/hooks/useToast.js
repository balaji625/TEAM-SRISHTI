/**
 * useToast — wrapper around react-hot-toast for consistent usage.
 */
import toast from 'react-hot-toast';

const useToast = () => ({
  success: (msg) => toast.success(msg),
  error: (msg) => toast.error(msg),
  info: (msg) => toast(msg),
  loading: (msg) => toast.loading(msg),
  dismiss: (id) => toast.dismiss(id),
});

export default useToast;
