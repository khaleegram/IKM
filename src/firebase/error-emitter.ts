// A simple event emitter for handling global errors, like permission denials.
// This allows different parts of the app to emit an error and a central
// listener component (e.g., in the root layout) to display it.

type EventListener = (data: any) => void;

class EventEmitter {
  private listeners: { [event: string]: EventListener[] } = {};

  on(event: string, listener: EventListener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: EventListener) {
    if (!this.listeners[event]) return;

    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  emit(event: string, data: any) {
    if (!this.listeners[event]) return;

    this.listeners[event].forEach(listener => listener(data));
  }
}

export const errorEmitter = new EventEmitter();
