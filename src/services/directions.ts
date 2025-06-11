import { config } from '../config/config';

export const getDirections = async (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${endLat},${endLng}&key=${config.googleMaps.apiKey}`
    );
    const data = await response.json();
    return data.routes[0].overview_polyline.points.map((point: string) => {
      const [lat, lng] = point.split(',').map(Number);
      return { latitude: lat, longitude: lng };
    });
  } catch (error) {
    console.error('Error fetching directions:', error);
    return [];
  }
}; 