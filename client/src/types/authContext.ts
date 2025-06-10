export type AuthContextType = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
};
