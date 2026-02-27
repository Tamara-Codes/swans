'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function UploadDialog({ open, onOpenChange, onSuccess }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') {
      toast({ title: 'Invalid file', description: 'Please upload a PDF file.', variant: 'destructive' })
      return
    }
    setFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  const handleSubmit = async () => {
    if (!file) return
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('pdf', file)

      const res = await fetch('/api/intakes', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Upload failed')

      toast({ title: 'PDF uploaded', description: 'Extraction has started. The intake will appear shortly.' })
      onOpenChange(false)
      setFile(null)
      onSuccess?.()
      router.push(`/intakes/${data.intake_id}`)
    } catch (err: unknown) {
      toast({ title: 'Upload failed', description: err instanceof Error ? err.message : 'Upload failed', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!uploading) {
      onOpenChange(false)
      setFile(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">New Intake</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Upload the police report PDF. All fields will be extracted automatically.
          </DialogDescription>
        </DialogHeader>

        <div
          className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragging ? 'border-slate-400 bg-slate-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-slate-400" />
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate max-w-[280px]">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                className="ml-2 text-slate-400 hover:text-slate-600"
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Drag & drop a PDF or <span className="text-slate-700 underline">browse</span></p>
              <p className="text-xs text-slate-400 mt-1">Police report PDF only</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={handleClose} disabled={uploading} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file || uploading} className="flex-1 bg-slate-900 hover:bg-slate-800">
            {uploading ? 'Uploading...' : 'Upload & Extract'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
