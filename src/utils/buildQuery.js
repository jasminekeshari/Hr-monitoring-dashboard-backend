export function buildQuery({ interfaceName, integrationKey, status, severity, search, start, end }) {
  const q = {};
  if (interfaceName) q.interfaceName = { $regex: interfaceName, $options: 'i' };
  if (integrationKey) q.integrationKey = { $regex: integrationKey, $options: 'i' };
  if (status) q.status = status;
  if (severity) q.severity = severity;
  if (search) {
    q.$or = [
      { message: { $regex: search, $options: 'i' } },
      { interfaceName: { $regex: search, $options: 'i' } },
      { integrationKey: { $regex: search, $options: 'i' } }
    ];
  }
  if (start || end) {
    q.createdAt = {};
    if (start) q.createdAt.$gte = start;
    if (end) q.createdAt.$lte = end;
  }
  return q;
}
