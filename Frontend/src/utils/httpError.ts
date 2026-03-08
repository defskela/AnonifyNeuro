import axios from 'axios';

const hasResponse = (error: unknown): error is { response?: { status?: number; data?: { detail?: string } } } => {
  return typeof error === 'object' && error !== null && 'response' in error;
};

export const getErrorStatus = (error: unknown): number | undefined => {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }

  if (hasResponse(error)) {
    return error.response?.status;
  }

  return undefined;
};

export const getErrorDetail = (error: unknown): string | undefined => {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail;
  }

  if (hasResponse(error)) {
    return error.response?.data?.detail;
  }

  return undefined;
};
