import { fakeAsync, tick } from '@angular/core/testing';
import { IdleTimer } from './idle-timer';

describe('IdleTimer', () => {
  const IDLE_MS = 60 * 60 * 1000;
  const WARNING_MS = 5 * 60 * 1000;
  const CHECK_INTERVAL_MS = 15000;

  let onWarning: jasmine.Spy;
  let onResume: jasmine.Spy;
  let onTimeout: jasmine.Spy;
  let timer: IdleTimer;

  beforeEach(() => {
    onWarning = jasmine.createSpy('onWarning');
    onResume = jasmine.createSpy('onResume');
    onTimeout = jasmine.createSpy('onTimeout');
    timer = new IdleTimer({
      idleMs: IDLE_MS,
      warningMs: WARNING_MS,
      checkIntervalMs: CHECK_INTERVAL_MS,
      onWarning,
      onResume,
      onTimeout,
    });
  });

  afterEach(() => {
    timer.stop();
  });

  it('does nothing before start() is called', fakeAsync(() => {
    tick(IDLE_MS + WARNING_MS);
    expect(onWarning).not.toHaveBeenCalled();
    expect(onTimeout).not.toHaveBeenCalled();
  }));

  it('fires onWarning once the remaining time drops to warningMs', fakeAsync(() => {
    timer.start();
    tick(IDLE_MS - WARNING_MS + CHECK_INTERVAL_MS);
    expect(onWarning).toHaveBeenCalledTimes(1);
    expect(onTimeout).not.toHaveBeenCalled();
  }));

  it('fires onTimeout once idleMs has fully elapsed with no activity', fakeAsync(() => {
    timer.start();
    tick(IDLE_MS + CHECK_INTERVAL_MS);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  }));

  it('stops checking after onTimeout fires (no repeated calls)', fakeAsync(() => {
    timer.start();
    tick(IDLE_MS + CHECK_INTERVAL_MS * 5);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  }));

  it('a window activity event before the warning threshold prevents onWarning from firing', fakeAsync(() => {
    timer.start();
    tick(IDLE_MS - WARNING_MS - CHECK_INTERVAL_MS);
    window.dispatchEvent(new Event('mousemove'));
    tick(CHECK_INTERVAL_MS * 2);
    expect(onWarning).not.toHaveBeenCalled();
  }));

  it('calls onResume when activity resumes after onWarning already fired', fakeAsync(() => {
    timer.start();
    tick(IDLE_MS - WARNING_MS + CHECK_INTERVAL_MS);
    expect(onWarning).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('keydown'));
    expect(onResume).toHaveBeenCalledTimes(1);
    // Fresh activity should push the timeout back out, not fire it.
    tick(IDLE_MS - CHECK_INTERVAL_MS);
    expect(onTimeout).not.toHaveBeenCalled();
  }));

  it('resetActivity() counts as fresh activity even without a real DOM event', fakeAsync(() => {
    timer.start();
    tick(IDLE_MS - WARNING_MS + CHECK_INTERVAL_MS);
    expect(onWarning).toHaveBeenCalledTimes(1);
    timer.resetActivity();
    expect(onResume).toHaveBeenCalledTimes(1);
    tick(IDLE_MS - CHECK_INTERVAL_MS);
    expect(onTimeout).not.toHaveBeenCalled();
  }));

  it('stop() removes listeners and cancels the check interval', fakeAsync(() => {
    timer.start();
    timer.stop();
    window.dispatchEvent(new Event('mousemove'));
    tick(IDLE_MS + WARNING_MS);
    expect(onWarning).not.toHaveBeenCalled();
    expect(onTimeout).not.toHaveBeenCalled();
  }));
});
