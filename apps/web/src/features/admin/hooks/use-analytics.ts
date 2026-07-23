import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/libs/orpc/client";

export function useAnalytics(period: "daily" | "weekly" | "monthly" = "daily", days = 30) {
	const { data: userGrowth, isLoading: loadingGrowth } = useQuery(
		orpc.admin.getUserGrowth.queryOptions({
			input: { period, days },
		}),
	);

	const { data: systemStats, isLoading: loadingStats } = useQuery(
		orpc.admin.getSystemStats.queryOptions({}),
	);

	return {
		userGrowth,
		systemStats,
		isLoading: loadingGrowth || loadingStats,
	};
}
