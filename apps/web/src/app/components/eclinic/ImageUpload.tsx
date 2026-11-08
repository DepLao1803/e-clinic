'use client'

import { useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { errMsg, uploadImage } from '@/lib/eclinic/api'

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const MAX_SIZE_MB = 2

interface ImageUploadProps {
  value?: string
  onChange: (dataUrl: string | undefined) => void
  shape?: 'circle' | 'square'
  size?: number
  label?: string
  hint?: string
  placeholderIcon?: string
}

/**
 * Chọn ảnh JPG/PNG (≤ 2MB) và tải lên API (POST /uploads). `onChange` nhận URL công khai của ảnh
 * để lưu vào icon_url / avatar_url.
 */
export default function ImageUpload({
  value,
  onChange,
  shape = 'square',
  size = 96,
  label = 'Tải ảnh lên',
  hint = 'JPG hoặc PNG, tối đa 2MB',
  placeholderIcon = 'solar:gallery-add-linear',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file: File | undefined) => {
    setError('')
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Chỉ nhận ảnh định dạng JPG hoặc PNG')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Dung lượng ảnh vượt quá ${MAX_SIZE_MB}MB`)
      return
    }
    setUploading(true)
    uploadImage(file, value)
      .then((url) => onChange(url))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setUploading(false))
  }

  return (
    <div className="flex items-start gap-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        style={{ width: size, height: size }}
        className={`relative shrink-0 flex items-center justify-center overflow-hidden border-2 border-dashed cursor-pointer transition-colors ${
          shape === 'circle' ? 'rounded-full' : 'rounded-xl'
        } ${dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/40 hover:border-primary/50'}`}
      >
        {uploading ? (
          <Icon icon="solar:refresh-linear" width={size * 0.32} className="animate-spin text-muted-foreground" />
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <Icon icon={placeholderIcon} width={size * 0.32} className="text-muted-foreground" />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <div className="flex flex-col gap-1.5 pt-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
        <div className="flex items-center gap-2 mt-1">
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <Icon icon="solar:upload-linear" width={14} className="mr-1" />
            {value ? 'Đổi ảnh' : 'Chọn ảnh'}
          </Button>
          {value && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(undefined)}>
              Xoá
            </Button>
          )}
        </div>
        {error && (
          <p className="text-xs text-error flex items-center gap-1 mt-0.5">
            <Icon icon="solar:danger-circle-linear" width={13} />
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
