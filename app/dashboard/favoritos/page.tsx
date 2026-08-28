import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FavoritesList } from "@/components/dashboard/favorites-list";

export default async function FavoritosDashboardPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const favorites = await prisma.favoriteStation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Gasolineras Favoritas</h1>
        <span className="text-sm text-muted-foreground">
          {favorites.length} {favorites.length === 1 ? "gasolinera" : "gasolineras"}
        </span>
      </div>

      <FavoritesList initialFavorites={favorites} />
    </>
  );
}
