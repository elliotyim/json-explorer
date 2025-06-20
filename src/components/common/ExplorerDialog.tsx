import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useDialogStore } from '@/store/dialog'
import { AlertDialogProps } from '@radix-ui/react-alert-dialog'
import React, { useEffect, useRef } from 'react'
import { AlertDialogFooter, AlertDialogHeader } from '../ui/alert-dialog'

const ExplorerDialog: React.FC<AlertDialogProps> = ({ ...props }) => {
  const { dialog, setDialog } = useDialogStore()

  const ref = useRef<HTMLDivElement>(null)

  const handleOpenChange = (open: boolean) => {
    if (!open) setDialog({ open })
  }

  useEffect(() => {
    if (dialog.open) ref.current?.click()
  }, [dialog.open])

  return (
    <AlertDialog {...props} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <div ref={ref} style={{ width: 0, height: 0 }} />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className={dialog.title ? 'visible' : 'hidden'}>
            {dialog.title}
          </AlertDialogTitle>
          <AlertDialogDescription
            className={dialog.content ? 'visible' : 'hidden'}
          >
            {dialog.content}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {dialog.cancelButton ? (
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          ) : null}
          <AlertDialogAction>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ExplorerDialog
