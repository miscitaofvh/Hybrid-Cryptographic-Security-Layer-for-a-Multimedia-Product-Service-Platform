import API from "@/config/api";
import type { Track } from "@/types/track";
import { useAuth } from "@/context/AuthContext";

export const useTrackService = () => {
  const { accessToken } = useAuth();
  const getTracks = async (): Promise<Track[]> => {
    const res = await API.get("/tracks/get-tracks", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.data;
  };

  const getTrackById = async (trackId: string): Promise<Track> => {
    const res = await API.get(`/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.data;
  };

  const getTrackStreamBlob = async (trackId: string): Promise<Blob> => {
    const res = await API.get(`/tracks/${trackId}/stream`,{
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: "blob",
    });
    return res.data;
  };

  return {
    getTracks,
    getTrackById,
    getTrackStreamBlob,
  };
}
