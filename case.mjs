// One case definition is shared by the analytical model and the spatial viewer.
export const CASE = Object.freeze({
  id: 'Room 001', timezone: 'America/New_York',
  geometry: Object.freeze({length: 3.6, width: 3.2, height: 2.7,
    orientation: 'East', windowWidth: 1.5, windowHeight: 1.2,
    clearWidth: 0.609, clearHeight: 1.055}),
  source: 'Constructed room and simulated record. No field measurements yet.',
  thermal: Object.freeze({ua: 46, fabricCapacity: 4.16e6, rho: 1.2, cp: 1005,
    baseACH: 0.2, extraACH: 2, setpoint: 22, deadband: 1,
    heatingW: 950, coolingW: 1350, permission: false,
    morningStart: 8, morningEnd: 10, eveningStart: 16, eveningEnd: 18,
    minOutdoor: 14, maxOutdoor: 26}),
  audit: Object.freeze({opening: 'no', thermostat: 'no', shading: 'yes', ventilation: 'no'}),
  protocol: Object.freeze({ratio: 0.25, duty: 0.7, controls: 1,
    minimumHours: 72, minimumCoverage: 0.85})
});
export const volume = CASE.geometry.length * CASE.geometry.width * CASE.geometry.height;
export const clearArea = CASE.geometry.clearWidth * CASE.geometry.clearHeight;
