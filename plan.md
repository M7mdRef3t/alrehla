1. Import `OverviewStats` from `../../../../services/adminApi` in `src/components/admin/dashboard/Overview/OverviewPanel.tsx`.
2. Replace `const [remoteStats, setRemoteStats] = useState<any>(null);` with `const [remoteStats, setRemoteStats] = useState<OverviewStats | null>(null);`.
3. Check if there are any build errors after the change, run `npm run check`.
