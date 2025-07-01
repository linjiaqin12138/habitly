import { CheckinProfile, CheckinRecord, CheckinFrequency } from '@/types/checkin';
import { Vault, VaultTransaction } from '@/types/vault';

export interface DashboardData {
    profiles: CheckinProfile[];
    records: CheckinRecord[];
    vault: Vault;
    transactions: VaultTransaction[];
}

export interface ProfileStats {
    id: string;
    title: string;
    todayStatus: '未打卡' | '已完成' | '不需要';
    monthlyCompletionRate: number;
    monthlyCompleted: number;
    streak: number;
}

export interface ProfileOption {
    id: string;
    title: string;
}

export interface CheckinRecordWithProfile extends CheckinRecord {
    profileTitle: string;
}