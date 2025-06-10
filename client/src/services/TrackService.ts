import API from "@/config/api";
import { useAuth } from "@/context/AuthContext";

export const useTrackService = () => {
  const { accessToken } = useAuth();

  const getTracks = async () => {
    const res = await API.get("/tracks/get-tracks", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.data;
  };

  return { getTracks };
};