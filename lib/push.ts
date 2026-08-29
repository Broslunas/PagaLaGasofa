import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails("mailto:soporte@pagalagasofa.app", vapidPublic, vapidPrivate);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// Manda a todas las suscripciones del usuario (puede tener varios navegadores/dispositivos).
// Si el endpoint ya no existe (404/410 — el usuario desinstaló o borró permisos),
// se borra la suscripción para no reintentar en vano cada vez que corre el cron.
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!vapidPublic || !vapidPrivate) return; // VAPID no configurado — no-op en local sin .env

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (e) {
        const statusCode = (e as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );
}
