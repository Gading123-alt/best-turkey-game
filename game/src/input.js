// input.js — keyboard and on-screen buttons, one shared state.
// Keys: arrows or WASD to move, Space to jump, Shift or X to dash,
// Enter to start/restart, M to mute, H for help. Buttons mirror the same state
// so mouse and touch players get the exact same game.

export class Input {
  constructor() {
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.jump = false;
    this.dash = false;
    this.pressedJump = false;
    this.pressedDash = false;
    this.pressedEnter = false;
    this.pressedMute = false;
    this.pressedHelp = false;
    this.anyKey = false;
    this.onFirstGesture = null;
    this.keyMap = {
      ArrowUp: 'up',
      KeyW: 'up',
      ArrowDown: 'down',
      KeyS: 'down',
      ArrowLeft: 'left',
      KeyA: 'left',
      ArrowRight: 'right',
      KeyD: 'right',
    };
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  gesture() {
    this.anyKey = true;
    if (this.onFirstGesture) {
      const fn = this.onFirstGesture;
      this.onFirstGesture = null;
      fn();
    }
  }

  handleKeyDown(event) {
    if (event.repeat) return;
    this.gesture();
    const field = this.keyMap[event.code];
    if (field) {
      this[field] = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'Space') {
      this.jump = true;
      this.pressedJump = true;
      event.preventDefault();
    } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight' || event.code === 'KeyX') {
      this.dash = true;
      this.pressedDash = true;
    } else if (event.code === 'Enter') {
      this.pressedEnter = true;
    } else if (event.code === 'KeyM') {
      this.pressedMute = true;
    } else if (event.code === 'KeyH') {
      this.pressedHelp = true;
    }
  }

  handleKeyUp(event) {
    const field = this.keyMap[event.code];
    if (field) {
      this[field] = false;
      return;
    }
    if (event.code === 'Space') this.jump = false;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight' || event.code === 'KeyX') {
      this.dash = false;
    }
  }

  // On-screen buttons call these; they set the same flags as the keys.
  pressButton(name) {
    this.gesture();
    if (name === 'jump') {
      this.jump = true;
      this.pressedJump = true;
    } else if (name === 'dash') {
      this.dash = true;
      this.pressedDash = true;
    } else {
      this[name] = true;
    }
  }

  releaseButton(name) {
    if (name === 'jump') this.jump = false;
    else if (name === 'dash') this.dash = false;
    else this[name] = false;
  }

  tapButton(name) {
    this.gesture();
    if (name === 'enter') this.pressedEnter = true;
    else if (name === 'mute') this.pressedMute = true;
    else if (name === 'help') this.pressedHelp = true;
  }

  // Consume the one-frame "pressed" flags at the end of each update.
  endFrame() {
    this.pressedJump = false;
    this.pressedDash = false;
    this.pressedEnter = false;
    this.pressedMute = false;
    this.pressedHelp = false;
  }
}
