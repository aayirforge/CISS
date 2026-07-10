// Simulated CISS headquarters coordinates (Delhi, India)
const MOCK_LAT = 28.6139;
const MOCK_LNG = 77.2090;

export const getCurrentLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation API not available in this browser. Using simulation fallback.');
      resolve({
        lat: MOCK_LAT,
        lng: MOCK_LNG,
        error: 'Simulation mode (browser geoloc not supported)'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          error: null
        });
      },
      (error) => {
        console.warn('Geolocation access failed/denied. Using simulation fallback:', error);
        resolve({
          lat: MOCK_LAT,
          lng: MOCK_LNG,
          error: `Simulation mode (${error.message})`
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
};
