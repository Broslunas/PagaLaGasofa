import "server-only"

import { supabaseEnv } from "@/lib/supabase/env"

export const tripChannel = (shareId: string) => `trip-${shareId}`

/**
 * Avisa por Supabase Realtime (broadcast, vía REST) de que un ticket ha cambiado.
 * El mensaje no lleva datos: los clientes solo lo usan para volver a pedirlos al servidor,
 * así que un mensaje falso (el canal es público) no puede alterar lo que se muestra.
 * Nunca lanza: si Realtime falla, los clientes se actualizan al recuperar el foco.
 */
export async function broadcastTripChanged(shareId: string) {
  try {
    const { url, anonKey } = supabaseEnv()
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ topic: tripChannel(shareId), event: "changed", payload: {}, private: false }] }),
      signal: AbortSignal.timeout(4000),
    })
  } catch (error) {
    console.warn("broadcastTripChanged:", (error as Error).message)
  }
}
