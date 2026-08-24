import { DashboardPageSkeleton } from "@/components/dashboard/page-skeleton";

/** Ces pages n'affichent pas d'indicateurs en tête : la silhouette non plus. */
export default function Loading() {
  return <DashboardPageSkeleton cards={0} />;
}
