import dynamic from "next/dynamic";

export const MapView = dynamic(() => import("./Mapview"), {
  ssr: false,
  loading: () => <div className="text-center p-4">Loading map...</div>,
});

export const UserLocation = dynamic(() => import("./UserLocation"), {
  ssr: false,
});
