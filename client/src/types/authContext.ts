export type AuthContextType = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  user: UserInfoType | null;
  setUser: (user: UserInfoType | null) => void;
  getMe: (token?: string) => Promise<UserInfoType | null>;
  loading: boolean;
  logout: () => Promise<void>;
};

export type UserInfoType = {
  id: string;
  sessionId: string;
  role: string;
  artistId: string;
};
