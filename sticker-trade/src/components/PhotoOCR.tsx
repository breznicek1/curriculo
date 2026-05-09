'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  albumId: string
  onNumbersDetected: (numbers: number[]) => void
}

export default function PhotoOCR({ userId, albumId, onNumbersDetected }: Props) {
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [phase, setPhase]     = useState<'idle' | 'uploading' | 'ocr' | 'done' | 'error'>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [detected, setDetected] = useState<number[]>([])
  const [progress, setProgress] = useState(0)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setPhase('uploading')
    setProgress(10)

    // Upload para Supabase Storage
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`
    const { data: upload, error: uploadError } = await supabase.storage
      .from('sticker-photos')
      .upload(path, file, { upsert: true })

    if (uploadError) { setPhase('error'); return }

    const { data: { publicUrl } } = supabase.storage
      .from('sticker-photos')
      .getPublicUrl(upload.path)

    setPhotoUrl(publicUrl)
    await supabase.schema('figurinhas').from('sticker_photos')
      .insert({ user_id: userId, photo_url: publicUrl })

    setProgress(40)
    setPhase('ocr')

    // OCR via Tesseract.js — importado dinamicamente para não aumentar bundle inicial
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('por', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setProgress(40 + Math.round(m.progress * 55))
          }
        },
      })

      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()

      // Extrai números de 1-638 do texto reconhecido
      const matches = text.match(/\b([1-9][0-9]{0,2})\b/g) ?? []
      const numbers = [...new Set(
        matches
          .map(Number)
          .filter((n) => n >= 1 && n <= 638)
      )].sort((a, b) => a - b)

      setDetected(numbers)
      setProgress(100)
      setPhase('done')
    } catch {
      setPhase('error')
    }
  }

  function confirmNumbers() {
    onNumbersDetected(detected)
    setPhase('idle')
    setPreview(null)
    setDetected([])
  }

  function removeNumber(n: number) {
    setDetected((prev) => prev.filter((x) => x !== n))
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
        📷 Cadastrar por foto
      </h2>
      <p className="text-xs text-gray-400 mb-4">
        Tire uma foto da sua pilha de figurinhas. O OCR detecta os números automaticamente.
      </p>

      {phase === 'idle' && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.removeAttribute('capture')
                  fileRef.current.click()
                }
              }}
              className="flex-1 border-2 border-dashed border-gray-200 rounded-xl py-6 text-center text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors text-sm"
            >
              📁 Galeria
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 border-2 border-dashed border-gray-200 rounded-xl py-6 text-center text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors text-sm"
            >
              📷 Câmera
            </button>
          </div>
        </div>
      )}

      {(phase === 'uploading' || phase === 'ocr') && (
        <div className="text-center py-6">
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-xl mx-auto mb-4 opacity-70"
            />
          )}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">
            {phase === 'uploading' ? 'Enviando foto...' : `Lendo números... ${progress}%`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Isso pode levar alguns segundos
          </p>
        </div>
      )}

      {phase === 'done' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            {preview && (
              <img src={preview} alt="Foto" className="w-16 h-16 object-cover rounded-lg" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {detected.length} números detectados
              </p>
              <p className="text-xs text-gray-400">
                Remova os incorretos antes de confirmar
              </p>
            </div>
          </div>

          {detected.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-1.5 mb-4 max-h-40 overflow-y-auto p-1">
                {detected.map((n) => (
                  <button
                    key={n}
                    onClick={() => removeNumber(n)}
                    className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium hover:bg-red-100 hover:text-red-700 transition-colors"
                    title="Clique para remover"
                  >
                    #{n} ×
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={confirmNumbers}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                >
                  ✓ Confirmar {detected.length} figurinhas
                </button>
                <button
                  onClick={() => { setPhase('idle'); setPreview(null); setDetected([]) }}
                  className="px-3 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">
                Nenhum número detectado. A foto pode estar borrada ou os números estão cobertos.
              </p>
              <button
                onClick={() => { setPhase('idle'); setPreview(null) }}
                className="text-sm text-green-700 underline"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'error' && (
        <div className="text-center py-4">
          <p className="text-sm text-red-600 mb-3">Erro ao processar a foto.</p>
          <button
            onClick={() => { setPhase('idle'); setPreview(null) }}
            className="text-sm text-green-700 underline"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}
