import toast from 'react-hot-toast'

export const toastStyles = {
  style: {
    background: '#1e2837',
    color: '#fff',
    border: '1px solid #2d3e50',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
  },
  success: {
    iconTheme: {
      primary: '#0484e0',
      secondary: '#fff',
    },
  },
  error: {
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff',
    },
  },
}

export const showSuccessToast = (message: string) => {
  toast.success(message, toastStyles)
}

export const showErrorToast = (message: string) => {
  toast.error(message, toastStyles)
}

export const showLoadingToast = (message: string) => {
  return toast.loading(message, toastStyles)
}
