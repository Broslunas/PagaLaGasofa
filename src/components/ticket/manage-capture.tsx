"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { parseManageFragment } from "@/lib/trip/share"

/** Si la URL trae el enlace secreto de gestión (#gestion=…), lo canjea por la cookie del dispositivo. */
export function ManageCapture({ shareId }: { shareId: string }) {
  const router = useRouter()

  useEffect(() => {
    const token = parseManageFragment(window.location.hash)
    if (!token) return
    // Se quita el fragmento enseguida para que el token no quede en el historial ni se copie sin querer.
    history.replaceState(null, "", window.location.pathname + window.location.search)
    fetch(`/api/trips/${shareId}/manage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then((res) => res.ok && router.refresh())
  }, [shareId, router])

  return null
}
