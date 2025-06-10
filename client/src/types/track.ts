export type Track = {
  id: string;
  title: string;
  coverUrl: string;
  duration: number;
  album?: string;
  genre?: string;
  artists: string[];
};
