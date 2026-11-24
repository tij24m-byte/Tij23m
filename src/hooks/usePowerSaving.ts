import { useCallback, useEffect, useState } from 'react';

interface BatteryManagerLike extends EventTarget {
  level: number;
  charging: boolean;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManagerLike>;
}

const POWER_SAVING_STORAGE_KEY = 'cbos_power_saving_mode';

export const NORMAL_SYNC_INTERVAL_MS = 15_000;
export const POWER_SAVING_BALANCED_SYNC_MS = 120_000;
export const POWER_SAVING_LOW_BATTERY_SYNC_MS = 300_000;
export const LOW_BATTERY_THRESHOLD_PERCENT = 20;

export function usePowerSaving() {
  const [isPowerSavingEnabled, setIsPowerSavingEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(POWER_SAVING_STORAGE_KEY) === 'true';
  });

  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem(
      POWER_SAVING_STORAGE_KEY,
      isPowerSavingEnabled ? 'true' : 'false'
    );
  }, [isPowerSavingEnabled]);

  useEffect(() => {
    const nav = navigator as NavigatorWithBattery;
    if (typeof nav.getBattery !== 'function') return;

    let mounted = true;
    let batteryRef: BatteryManagerLike | null = null;

    const syncBatteryState = () => {
      if (!mounted || !batteryRef) return;
      setBatteryLevel(Math.round(batteryRef.level * 100));
      setIsCharging(batteryRef.charging);
    };

    nav
      .getBattery()
      .then((battery) => {
        if (!mounted) return;
        batteryRef = battery;
        syncBatteryState();
        battery.addEventListener('levelchange', syncBatteryState);
        battery.addEventListener('chargingchange', syncBatteryState);
      })
      .catch(() => {
        // Battery Status API unavailable in this browser context
      });

    return () => {
      mounted = false;
      if (batteryRef) {
        batteryRef.removeEventListener('levelchange', syncBatteryState);
        batteryRef.removeEventListener('chargingchange', syncBatteryState);
      }
    };
  }, []);

  const togglePowerSaving = useCallback(() => {
    setIsPowerSavingEnabled((prev) => !prev);
  }, []);

  const isLowBattery =
    batteryLevel !== null &&
    batteryLevel <= LOW_BATTERY_THRESHOLD_PERCENT &&
    !isCharging;

  const syncIntervalMs = !isPowerSavingEnabled
    ? NORMAL_SYNC_INTERVAL_MS
    : isLowBattery
    ? POWER_SAVING_LOW_BATTERY_SYNC_MS
    : POWER_SAVING_BALANCED_SYNC_MS;

  return {
    isPowerSavingEnabled,
    togglePowerSaving,
    batteryLevel,
    isCharging,
    isLowBattery,
    syncIntervalMs,
  };
}
