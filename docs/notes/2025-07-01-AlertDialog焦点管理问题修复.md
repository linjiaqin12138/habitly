# AlertDialog焦点管理问题修复

## 1. 问题背景

用户在打卡配置列表页面点击删除按钮弹出确认对话框后，出现了可访问性错误：

```
Blocked aria-hidden on an element because its descendant retained focus. The focus must not be hidden from assistive technology users. Avoid using aria-hidden on a focused element or its ancestor.
```

同时页面出现冻结现象，点击取消/确认后无法操作任何按钮，严重影响用户体验。

## 2. 方案思考

**问题根本原因分析**：
- DropdownMenu和AlertDialog的焦点管理冲突
- 当AlertDialog打开时，使用`aria-hidden`隐藏背景内容，但焦点仍保留在被隐藏的DropdownMenu元素上
- 辅助技术无法正确访问当前获得焦点的元素，导致可访问性错误和页面冻结

**解决方案设计**：
1. 在打开AlertDialog之前确保DropdownMenu完全关闭
2. 添加状态管理跟踪下拉菜单的开启状态
3. 使用延迟机制确保组件状态正确切换
4. 优化删除操作的状态管理

## 3. 代码实现

### 主要变更

**添加状态管理**：
```typescript
const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
```

**修复删除点击处理**：
```typescript
const handleDeleteClick = (profile: CheckinProfile) => {
  // 先关闭dropdown
  setOpenDropdownId(null);
  // 使用setTimeout确保dropdown完全关闭后再打开dialog
  setTimeout(() => {
    setProfileToDelete(profile);
    setDeleteDialogOpen(true);
  }, 50);
};
```

**优化删除确认和取消处理**：
```typescript
const handleDeleteConfirm = async () => {
  if (!profileToDelete) return;
  try {
    setDeleting(true);
    await deleteCheckinProfile(profileToDelete.id);
    toast.success('打卡配置已删除');
    setDeleteDialogOpen(false);
    setProfileToDelete(null);
    await loadProfiles();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '删除打卡配置失败';
    toast.error(errorMessage);
  } finally {
    setDeleting(false);
  }
};

const handleDeleteCancel = () => {
  setDeleteDialogOpen(false);
  setProfileToDelete(null);
};
```

## 4. 遇到的问题与解决方案

### 问题1：组件状态切换时机
**现象**：直接关闭DropdownMenu后立即打开AlertDialog，焦点管理仍然冲突
**解决**：使用50ms的setTimeout延迟，确保DropdownMenu的关闭动画和状态更新完成
**注意**：异步组件状态切换需要考虑DOM更新时机

### 问题2：可访问性标准理解
**现象**：最初不清楚aria-hidden的正确使用场景
**解决**：理解aria-hidden会完全隐藏元素及其子元素，不应用于仍有焦点的元素
**注意**：开发时需要关注可访问性标准，特别是焦点管理

### 问题3：状态管理复杂度
**现象**：多个组件状态需要协调管理
**解决**：明确状态职责，确保每个状态变更都有对应的清理逻辑
**注意**：复杂交互场景下要仔细设计状态管理流程

## 5. 与用户沟通的经验

- **问题描述要详细**：用户提供了完整的错误信息和现象描述，便于快速定位问题
- **解释技术原理**：向用户说明了aria-hidden和焦点管理的技术原理，帮助理解问题本质
- **提供完整解决方案**：不仅修复了当前问题，还优化了相关的状态管理逻辑
- **确认修复效果**：明确告知用户修复后的预期效果

**最终结果**：成功解决了可访问性错误和页面冻结问题，删除功能恢复正常，提升了用户体验和代码的可访问性标准。