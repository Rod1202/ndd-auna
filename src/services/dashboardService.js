import { getDashboard } from './api'

export const fetchDashboardData = async () => {
    return await getDashboard()
}