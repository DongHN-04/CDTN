export const formatApiError = (error, fallback = 'Co loi xay ra') => {
  const details = error?.response?.data?.details;

  if (Array.isArray(details) && details.length > 0) {
    return details
      .map(item => `${item.field}: ${item.message}`)
      .join('\n');
  }

  return error?.response?.data?.message || fallback;
};

export const ErrorBox = ({ message }) => {
  if (!message) return null;

  return (
    <div style={{
      whiteSpace: 'pre-line',
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fecaca',
      borderRadius: 6,
      padding: 10,
      marginBottom: 12,
      fontSize: 13,
      lineHeight: 1.5,
    }}>
      {message}
    </div>
  );
};
