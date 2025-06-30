import { CheckinProfile, CheckinProfileUpdateRequest, CheckinProfileCreateRequest, CheckinRecordsResponse } from '@/types/checkin';

// 获取打卡配置列表
export async function getCheckinProfiles(): Promise<{ profiles: CheckinProfile[] }> {
  const response = await fetch('/api/checkin/profile');
  if (!response.ok) {
    throw new Error('获取打卡配置列表失败');
  }
  return await response.json();
}

// 获取打卡配置详情
export async function getCheckinProfile(id: string): Promise<{ profile: CheckinProfile }> {
  const response = await fetch(`/api/checkin/profile/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('NOT_FOUND');
    }
    throw new Error('获取打卡配置失败');
  }
  return await response.json();
}

// 更新打卡配置
export async function updateCheckinProfile(id: string, data: CheckinProfileUpdateRequest): Promise<{ profile: CheckinProfile }> {
  const response = await fetch(`/api/checkin/profile/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '更新打卡配置失败');
  }

  return await response.json();
}

// 删除打卡配置
export async function deleteCheckinProfile(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/checkin/profile/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '删除打卡配置失败');
  }

  return await response.json();
}

// 创建打卡配置
export async function createCheckinProfile(data: CheckinProfileCreateRequest): Promise<{ profile: CheckinProfile }> {
  const response = await fetch('/api/checkin/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '保存打卡配置失败');
  }

  return await response.json();
}

// 获取打卡记录
export async function getCheckinRecords(options: {
  profileId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<CheckinRecordsResponse> {
  const params = new URLSearchParams();
  
  if (options.profileId) params.append('profileId', options.profileId);
  if (options.startDate) params.append('startDate', options.startDate);
  if (options.endDate) params.append('endDate', options.endDate);
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());

  const response = await fetch(`/api/checkin/records?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '获取打卡记录失败');
  }
  return await response.json();
}