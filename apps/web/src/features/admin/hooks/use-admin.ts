import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client, orpc } from "@/libs/orpc/client";

export function useUsers(params: { page: number; limit: number; search?: string; role?: string }) {
	return useQuery(orpc.admin.getUsers.queryOptions({ input: params }));
}

export function useUserById(id: string) {
	return useQuery(orpc.admin.getUserById.queryOptions({ input: { id } }));
}

export function useUserGrowth(days = 30) {
	return useQuery(orpc.admin.getUserGrowth.queryOptions({ input: { days } }));
}

export function useSystemStats() {
	return useQuery(orpc.admin.getSystemStats.queryOptions({ input: {} }));
}

export function useUpdateUser() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: { id: string; name?: string; email?: string; role?: "admin" | "user" }) =>
			client.admin.updateUser(data),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: ["admin"] });
		},
	});
}

export function useDeleteUser() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => client.admin.deleteUser({ id }),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: ["admin"] });
		},
	});
}

export function useBanUser() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: { id: string; banned: boolean; reason?: string }) =>
			client.admin.banUser(data),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: ["admin"] });
		},
	});
}
