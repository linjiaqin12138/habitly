import { CheckinProfile, CheckinRecord } from '@/types/checkin';
import { Vault, VaultTransaction } from '@/types/vault';

export interface DashboardData {
    profiles: CheckinProfile[];
    records: CheckinRecord[];
    vault: Vault;
    transactions: VaultTransaction[];
}

export enum TodayStatus {
    NOT_CHECKED = 'NOT_CHECKED',
    COMPLETED = 'COMPLETED',
    NOT_REQUIRED = 'NOT_REQUIRED'
}

export interface ProfileStats {
    id: string;
    title: string;
    todayStatus?: TodayStatus;
    monthlyCompletionRate: number;
    monthlyCompleted: number;
    streak: number;
    isActive: boolean;
}

export interface ProfileOption {
    id: string;
    title: string;
}

export interface CheckinRecordWithProfile extends CheckinRecord {
    profileTitle: string;
}