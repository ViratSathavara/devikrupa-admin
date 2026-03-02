import { toast } from "react-hot-toast";

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong"
): string => {
  const typedError = error as ApiError;
  return (
    typedError?.response?.data?.message ||
    typedError?.message ||
    fallback
  );
};

export const showApiError = (error: unknown, fallback?: string) => {
  toast.error(getApiErrorMessage(error, fallback));
};

export { toast };
