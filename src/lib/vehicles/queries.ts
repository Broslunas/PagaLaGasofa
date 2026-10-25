import "server-only"

import { and, asc, desc, eq, ne } from "drizzle-orm"

import { getDb } from "@/db"
import { vehicles } from "@/db/schema"

import type { VehicleInput } from "./schema"

export const listVehicles = (userId: string) =>
  getDb()
    .select()
    .from(vehicles)
    .where(eq(vehicles.userId, userId))
    .orderBy(desc(vehicles.isDefault), asc(vehicles.createdAt))

export async function createVehicle(userId: string, input: VehicleInput) {
  return getDb().transaction(async (tx) => {
    const existing = await tx.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.userId, userId)).limit(1)
    // El primer vehículo es el predeterminado; si se pide otro, se desmarca el anterior.
    const makeDefault = existing.length === 0 || input.isDefault === true
    if (makeDefault) {
      await tx.update(vehicles).set({ isDefault: false }).where(eq(vehicles.userId, userId))
    }
    const [row] = await tx
      .insert(vehicles)
      .values({ ...input, name: input.name || null, year: input.year ?? null, userId, isDefault: makeDefault })
      .returning()
    return row
  })
}

export async function updateVehicle(userId: string, id: string, input: Partial<VehicleInput>) {
  return getDb().transaction(async (tx) => {
    if (input.isDefault) {
      await tx
        .update(vehicles)
        .set({ isDefault: false })
        .where(and(eq(vehicles.userId, userId), ne(vehicles.id, id)))
    }
    const [row] = await tx
      .update(vehicles)
      .set({ ...input, name: input.name === undefined ? undefined : input.name || null })
      .where(and(eq(vehicles.id, id), eq(vehicles.userId, userId)))
      .returning()
    return row ?? null
  })
}

export async function deleteVehicle(userId: string, id: string) {
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .delete(vehicles)
      .where(and(eq(vehicles.id, id), eq(vehicles.userId, userId)))
      .returning({ id: vehicles.id, isDefault: vehicles.isDefault })
    if (!row) return false
    // Si era el predeterminado, el más antiguo de los que quedan pasa a serlo.
    if (row.isDefault) {
      const [next] = await tx.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.userId, userId)).orderBy(asc(vehicles.createdAt)).limit(1)
      if (next) await tx.update(vehicles).set({ isDefault: true }).where(eq(vehicles.id, next.id))
    }
    return true
  })
}
