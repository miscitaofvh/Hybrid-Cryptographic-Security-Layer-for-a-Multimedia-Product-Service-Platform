export type LoginInput = {
  email: string;
  password: string;
  otp?: string;
};

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
};
