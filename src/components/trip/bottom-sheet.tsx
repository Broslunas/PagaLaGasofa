"use client"

import { ChevronUp } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

export type SnapPoint = "peek" | "half" | "full"
const ORDER: SnapPoint[] = ["peek", "half", "full"]

interface Props {
  header: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  snap: SnapPoint
  onSnapChange: (snap: SnapPoint) => void
  /** Se informa de la altura visible (px) para encuadrar el mapa por encima. */
  onHeightChange?: (px: number) => void
  className?: string
}

const PEEK_PX = 156

/**
 * Hoja inferior arrastrable con tres alturas. Solo en móvil; en escritorio se usa un panel lateral.
 * Se redimensiona con `height` (no con transform) para que el contenido siga siendo desplazable
 * en cada altura.
 */
export function BottomSheet({ header, footer, children, snap, onSnapChange, onHeightChange, className }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [containerH, setContainerH] = useState(0)
  const drag = useRef<{ startY: number; startH: number; t: number; lastY: number; lastT: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const parent = sheetRef.current?.parentElement
    if (!parent) return
    const ro = new ResizeObserver(() => setContainerH(parent.clientHeight))
    ro.observe(parent)
    setContainerH(parent.clientHeight)
    return () => ro.disconnect()
  }, [])

  const heights = useCallback(
    () => ({ peek: PEEK_PX, half: Math.round(containerH * 0.52), full: Math.round(containerH * 0.9) }),
    [containerH],
  )

  const targetH = heights()[snap]
  useEffect(() => {
    if (containerH) onHeightChange?.(targetH)
  }, [targetH, containerH, onHeightChange])

  function onPointerDown(e: React.PointerEvent) {
    const el = sheetRef.current
    if (!el || (e.target as HTMLElement).closest("[data-nodrag]")) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { startY: e.clientY, startH: el.offsetHeight, t: e.timeStamp, lastY: e.clientY, lastT: e.timeStamp }
    setDragging(true)
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current
    const el = sheetRef.current
    if (!d || !el) return
    const h = heights()
    const next = Math.min(h.full, Math.max(h.peek, d.startH + (d.startY - e.clientY)))
    el.style.height = `${next}px`
    d.lastY = e.clientY
    d.lastT = e.timeStamp
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current
    const el = sheetRef.current
    drag.current = null
    setDragging(false)
    if (!d || !el) return
    const h = heights()
    const velocity = (d.startY - e.clientY) / Math.max(1, e.timeStamp - d.t) // px/ms, + = hacia arriba
    const current = el.offsetHeight
    el.style.height = ""

    if (Math.abs(e.clientY - d.startY) < 6) return cycle() // un toque alterna la altura
    let target: SnapPoint
    if (Math.abs(velocity) > 0.5) {
      const idx = ORDER.findIndex((s) => h[s] >= d.startH - 2)
      target = ORDER[Math.min(ORDER.length - 1, Math.max(0, idx + (velocity > 0 ? 1 : -1)))]
    } else {
      target = ORDER.reduce((best, s) => (Math.abs(h[s] - current) < Math.abs(h[best] - current) ? s : best), "peek" as SnapPoint)
    }
    onSnapChange(target)
  }

  function cycle() {
    onSnapChange(snap === "peek" ? "half" : snap === "half" ? "full" : "peek")
  }

  return (
    <div
      ref={sheetRef}
      style={{ height: containerH ? targetH : PEEK_PX }}
      className={cn(
        "absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-3xl border-t bg-card shadow-[0_-10px_40px_-12px_rgba(0,0,0,0.35)]",
        !dragging && "transition-[height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
        className,
      )}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
      >
        <button
          type="button"
          // Con ratón o dedo el toque se resuelve en pointerup; el clic solo llega por teclado.
          onClick={(e) => e.detail === 0 && cycle()}
          aria-label={snap === "full" ? "Contraer panel" : "Expandir panel"}
          className="mx-auto flex h-6 w-full items-center justify-center"
        >
          <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          <ChevronUp className="sr-only" />
        </button>
        <div className="px-4 pb-2">{header}</div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
      {footer && (
        <div className="shrink-0 border-t bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>
      )}
    </div>
  )
}
