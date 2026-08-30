// Envío de Web Push desde el servidor (cron de precios, futuras notificaciones).
// Separado de lib/push.ts porque ese usa APIs de navegador (Notification,
// navigator.serviceWorker) y este usa la librería "web-push" con la clave privada.
import webPush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails("mailto:soporte@broslunas.com", vapidPublicKey, vapidPrivateKey);
}

type PushPayload = { title: string; body: string; url?: string };

// Manda a todos los dispositivos del usuario. Si un endpoint ya no existe
// (410/404, el navegador se desinstaló o revocó el permiso) lo borra.
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!vapidPublicKey || !vapidPrivateKey) return; // sin claves VAPID configuradas, no-op

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  const body = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );
}
