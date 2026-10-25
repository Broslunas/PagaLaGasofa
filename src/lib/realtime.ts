import "server-only"

import { supabaseEnv } from "@/lib/supabase/env"

export const tripChannel = (shareId: string) => `trip-${shareId}`
export const liveChannel = (shareId: string) => `live-${shareId}`

/**
 * Avisa por Supabase Realtime (broadcast, vía REST) de que algo ha cambiado en un canal.
 * El mensaje no lleva datos: los clientes solo lo usan para volver a pedirlos al servidor,
 * así que un mensaje falso (el canal es público) no puede alterar lo que se muestra.
 * Nunca lanza: si Realtime falla, los clientes se actualizan al recuperar el foco.
 */
export async function broadcastChanged(topic: string) {
  try {
    const { url, anonKey } = supabaseEnv()
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ topic, event: "changed", payload: {}, private: false }] }),
      signal: AbortSignal.timeout(4000),
    })
  } catch (error) {
    console.warn("broadcastChanged:", (error as Error).message)
  }
}

export const broadcastTripChanged = (shareId: string) => broadcastChanged(tripChannel(shareId))
export const broadcastLiveChanged = (shareId: string) => broadcastChanged(liveChannel(shareId))
