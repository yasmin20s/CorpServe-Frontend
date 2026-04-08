function pick(raw, ...keys) {
  for (const key of keys) {
    const value = raw?.[key];
    if (value !== undefined) return value;
  }
  return undefined;
}

export function normalizeNotificationDto(raw) {
  const id = pick(raw, 'id', 'Id', 'notificationId', 'NotificationId', 'notificationID', 'NotificationID') ?? '';

  return {
    id,
    title: String(pick(raw, 'title', 'Title') ?? ''),
    message: String(pick(raw, 'message', 'Message') ?? ''),
    type: pick(raw, 'type', 'Type') ?? 'Info',
    isRead: Boolean(pick(raw, 'isRead', 'IsRead')),
    createdAt: pick(raw, 'createdAt', 'CreatedAt') ?? '',
    relatedEntityId: pick(raw, 'relatedEntityId', 'RelatedEntityId') ?? null,
    relatedEntityType: pick(raw, 'relatedEntityType', 'RelatedEntityType') ?? null,
    navigateUrl: String(pick(raw, 'navigateUrl', 'NavigateUrl') ?? ''),
  };
}
