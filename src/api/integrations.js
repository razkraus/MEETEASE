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

export const Core = {
  InvokeLLM,
  SendEmail,
  UploadFile,
  GenerateImage,
  ExtractDataFromUploadedFile,
};
