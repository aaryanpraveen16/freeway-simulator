import { create } from 'zustand';
import { UnitSystem } from '@/utils/unitConversion';

interface UIState {
  showCharts: boolean;
  showCarStats: boolean;
  showFreewayUI: boolean;
  showPackFormation: boolean;
  unitSystem: UnitSystem;
  carSize: number;
  showNotifications: boolean;

  // Actions
  setShowCharts: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowCarStats: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowFreewayUI: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowPackFormation: (show: boolean | ((prev: boolean) => boolean)) => void;
  setUnitSystem: (system: UnitSystem) => void;
  setCarSize: (size: number) => void;
  setShowNotifications: (show: boolean | ((prev: boolean) => boolean)) => void;
}

export const useUIStore = create<UIState>((set) => ({
  showCharts: false,
  showCarStats: false,
  showFreewayUI: true,
  showPackFormation: false,
  unitSystem: 'metric',
  carSize: 24,
  showNotifications: false,

  setShowCharts: (show) =>
    set((state) => ({ showCharts: typeof show === 'function' ? show(state.showCharts) : show })),
  setShowCarStats: (show) =>
    set((state) => ({ showCarStats: typeof show === 'function' ? show(state.showCarStats) : show })),
  setShowFreewayUI: (show) =>
    set((state) => ({ showFreewayUI: typeof show === 'function' ? show(state.showFreewayUI) : show })),
  setShowPackFormation: (show) =>
    set((state) => ({ showPackFormation: typeof show === 'function' ? show(state.showPackFormation) : show })),
  setUnitSystem: (system) => set({ unitSystem: system }),
  setCarSize: (size) => set({ carSize: size }),
  setShowNotifications: (show) =>
    set((state) => ({ showNotifications: typeof show === 'function' ? show(state.showNotifications) : show })),
}));
