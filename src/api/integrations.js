// Local stub implementations for integration utilities

export const InvokeLLM = async (prompt) => {
  console.info('InvokeLLM stub called with:', prompt);
  return 'Local mode does not support LLM calls';
};

export const SendEmail = async (payload) => {
  console.info('SendEmail stub called with:', payload);
  return { status: 'queued' };
};

export const UploadFile = async (file) => {
  console.info('UploadFile stub called with:', file?.name || file);
  return { url: URL.createObjectURL(file) };
};

export const GenerateImage = async (prompt) => {
  console.info('GenerateImage stub called with:', prompt);
  return { url: '' };
};

export const ExtractDataFromUploadedFile = async (file) => {
  console.info('ExtractDataFromUploadedFile stub called with:', file?.name || file);
  return {};
};

const formatDate = (date) =>
  new Date(date).toISOString().replace(/[-:]|\.\d{3}/g, '');

export const AddToGoogleCalendar = (event) => {
  const start = formatDate(event.start);
  const end = formatDate(event.end ?? event.start);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || '',
    dates: `${start}/${end}`,
    details: event.description || '',
  });
  const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
  console.info('AddToGoogleCalendar stub called with:', event);
  return url;
};

export const AddToOutlookCalendar = (event) => {
  const start = new Date(event.start).toISOString();
  const end = new Date(event.end ?? event.start).toISOString();
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    subject: event.title || '',
    startdt: start,
    enddt: end,
    body: event.description || '',
  });
  const url = `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
  console.info('AddToOutlookCalendar stub called with:', event);
  return url;
};

export const Core = {
  InvokeLLM,
  SendEmail,
  UploadFile,
  GenerateImage,
  ExtractDataFromUploadedFile,
  AddToGoogleCalendar,
  AddToOutlookCalendar,
};

