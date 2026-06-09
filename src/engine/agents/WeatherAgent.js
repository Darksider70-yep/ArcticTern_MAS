// ArcticTern ATC — Weather Agent
// State machine with probabilistic transitions for weather conditions

export const WEATHER_STATES = {
  CLEAR: 'CLEAR',
  CLOUDY: 'CLOUDY',
  STORM: 'STORM',
  CLEARING: 'CLEARING',
};

const WIND_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export class WeatherAgent {
  constructor() {
    this.state = WEATHER_STATES.CLEAR;
    this.visibility = 10; // km
    this.windSpeed = 8;   // knots
    this.windDirection = 'W';
    this.intensity = 0;   // 0-10
    this.stormCell = null; // { x, y, vx, vy, radius }
    this.stateTimer = 0;
    this.transitionThresholds = {
      CLEAR: 300,    // ticks before possible transition
      CLOUDY: 150,
      STORM: 200,
      CLEARING: 100,
    };
    this.lastAction = 'CLEAR';
    this.forcedState = null;
  }

  forceWeather(state) {
    this.forcedState = state;
    this.transitionTo(state);
  }

  transitionTo(newState) {
    this.state = newState;
    this.stateTimer = 0;

    switch (newState) {
      case WEATHER_STATES.CLEAR:
        this.visibility = 8 + Math.random() * 4;
        this.windSpeed = 5 + Math.random() * 10;
        this.intensity = 0;
        this.stormCell = null;
        break;
      case WEATHER_STATES.CLOUDY:
        this.visibility = 4 + Math.random() * 4;
        this.windSpeed = 10 + Math.random() * 15;
        this.intensity = 2 + Math.random() * 2;
        break;
      case WEATHER_STATES.STORM:
        this.visibility = 1 + Math.random() * 3;
        this.windSpeed = 20 + Math.random() * 20;
        this.intensity = 6 + Math.random() * 4;
        this.windDirection = WIND_DIRECTIONS[Math.floor(Math.random() * WIND_DIRECTIONS.length)];
        // Create a storm cell
        this.stormCell = {
          x: -100 + Math.random() * 200,
          y: 100 + Math.random() * 500,
          vx: 1 + Math.random() * 2,
          vy: -0.5 + Math.random(),
          radius: 80 + Math.random() * 120,
        };
        break;
      case WEATHER_STATES.CLEARING:
        this.visibility = 4 + Math.random() * 3;
        this.windSpeed = 10 + Math.random() * 10;
        this.intensity = 2 + Math.random() * 3;
        break;
    }
  }

  tick() {
    this.stateTimer++;

    // Update storm cell position
    if (this.stormCell) {
      this.stormCell.x += this.stormCell.vx;
      this.stormCell.y += this.stormCell.vy;

      // Storm passed the airport
      if (this.stormCell.x > 1200) {
        this.stormCell = null;
        if (this.state === WEATHER_STATES.STORM) {
          this.transitionTo(WEATHER_STATES.CLEARING);
        }
      }
    }

    // Add subtle variations
    this.windSpeed += (Math.random() - 0.5) * 0.5;
    this.windSpeed = Math.max(0, Math.min(50, this.windSpeed));
    this.visibility += (Math.random() - 0.5) * 0.2;
    this.visibility = Math.max(0.5, Math.min(15, this.visibility));

    // Random direction shifts
    if (Math.random() < 0.01) {
      this.windDirection = WIND_DIRECTIONS[Math.floor(Math.random() * WIND_DIRECTIONS.length)];
    }

    // State transitions (probabilistic)
    if (this.forcedState) return; // Don't auto-transition if forced

    const threshold = this.transitionThresholds[this.state];
    if (this.stateTimer > threshold) {
      const roll = Math.random();
      switch (this.state) {
        case WEATHER_STATES.CLEAR:
          if (roll < 0.02) this.transitionTo(WEATHER_STATES.CLOUDY);
          break;
        case WEATHER_STATES.CLOUDY:
          if (roll < 0.03) this.transitionTo(WEATHER_STATES.STORM);
          else if (roll < 0.06) this.transitionTo(WEATHER_STATES.CLEAR);
          break;
        case WEATHER_STATES.STORM:
          if (roll < 0.04) this.transitionTo(WEATHER_STATES.CLEARING);
          break;
        case WEATHER_STATES.CLEARING:
          if (roll < 0.05) this.transitionTo(WEATHER_STATES.CLEAR);
          break;
      }
    }

    this.lastAction = this.state;
  }

  getState() {
    return {
      state: this.state,
      visibility: Math.round(this.visibility * 10) / 10,
      windSpeed: Math.round(this.windSpeed),
      windDirection: this.windDirection,
      intensity: Math.round(this.intensity),
      stormCell: this.stormCell ? { ...this.stormCell } : null,
      isDisruptive: this.state === WEATHER_STATES.STORM || this.state === WEATHER_STATES.CLOUDY,
    };
  }

  getNarrationParams() {
    return {
      visibility: Math.round(this.visibility * 10) / 10,
      wind: Math.round(this.windSpeed),
      windDir: this.windDirection,
      intensity: Math.round(this.intensity),
      sector: this.stormCell ? 'NW' : 'N/A',
      stormDir: 'E',
      eta: this.stormCell ? Math.round((500 - this.stormCell.x) / (this.stormCell.vx * 60)) : 0,
    };
  }
}
