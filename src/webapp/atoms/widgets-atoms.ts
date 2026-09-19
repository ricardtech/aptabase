import { produce } from "immer";
import { atom, WritableAtom } from "jotai";

export type EventsChartWidgetConfig = {
  selectedEventNames: string[];
};

type WidgetType =
  | "custom-events-chart"
  | "realtime-gauge"
  | "events-chart"
  | "countries"
  | "operating-systems"
  | "devices"
  | "events"
  | "sports-games"
  | "app-versions";
const userDefinedWidgetTypes: WidgetType[] = ["custom-events-chart"];

export type SingleWidgetConfig<T = any> = {
  id: string;
  title: string;
  type: WidgetType;
  isDefined: boolean;
  isMinimized: boolean;
  orderIndex: number;
  properties?: T;
  supportsRemove?: boolean;
};

export type WidgetsConfig = {
  [key: string]: SingleWidgetConfig[];
};

export const DEFAULT_WIDGETS_CONFIG: SingleWidgetConfig[] = [
  {
    id: "main-chart",
    title: "Gráfico de Eventos",
    type: "events-chart",
    isMinimized: false,
    orderIndex: 0,
    isDefined: true,
  },
  {
    id: "country",
    title: "Países",
    type: "countries",
    isMinimized: false,
    orderIndex: 1,
    isDefined: true,
  },
  {
    id: "os",
    title: "Sistemas Operacionais",
    type: "operating-systems",
    isMinimized: false,
    orderIndex: 2,
    isDefined: true,
  },
  {
    id: "device",
    title: "Dispositivos",
    type: "devices",
    isMinimized: false,
    orderIndex: 3,
    isDefined: true,
  },
  {
    id: "sports-games",
    title: "Top Campeonatos & Jogos ao Vivo",
    type: "sports-games",
    isMinimized: false,
    orderIndex: 4,
    isDefined: true,
  },
  {
    id: "event",
    title: "Eventos",
    type: "events",
    isMinimized: false,
    orderIndex: 5,
    isDefined: true,
  },
  {
    id: "version",
    title: "Versões do App",
    type: "app-versions",
    isMinimized: false,
    orderIndex: 6,
    isDefined: true,
  },
  {
    id: "realtime-gauge",
    title: "Usuários no Momento",
    type: "realtime-gauge",
    isMinimized: false,
    orderIndex: 7,
    isDefined: true,
  },
  {
    id: "events-chart",
    title: "Gráfico Personalizado",
    type: "custom-events-chart",
    isMinimized: false,
    orderIndex: 8,
    isDefined: false,
    properties: {
      selectedEventNames: [],
    },
    supportsRemove: true,
  },
];

const EMPTY_CUSTOM_EVENTS_CHART_WIDGET: SingleWidgetConfig<EventsChartWidgetConfig> = {
  id: "events-chart",
  title: "Gráfico Personalizado",
  type: "custom-events-chart",
  isMinimized: false,
  orderIndex: 8,
  isDefined: false,
  properties: {
    selectedEventNames: [],
  },
  supportsRemove: true,
};

// Limpa chaves antigas de layout para garantir o alinhamento dos 6 cards
try {
  localStorage.removeItem("dashboard_widgets");
  localStorage.removeItem("dashboard_widgets_map");
  localStorage.removeItem("dashboard_widgets_map_v2");
} catch {}

const STORAGE_KEY = "dashboard_widgets_map_v3";

const initialWidgetsValue = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
const getDashboardWidgetAtom: WritableAtom<WidgetsConfig, WidgetsConfig[], void> = atom(initialWidgetsValue);

export const getDashboardWidgetsForAppAtom = atom((get) => {
  const widgets = get(getDashboardWidgetAtom);
  const getWidgetsForApp = (appId: string) => {
    const widgetWithAppId = widgets?.[appId];
    if (!widgetWithAppId) return DEFAULT_WIDGETS_CONFIG;
    
    // Assegura que todos os widgets padrão (incluindo Dispositivos e Sports) existam
    const existingIds = new Set(widgetWithAppId.map((w) => w.id));
    const missingDefaults = DEFAULT_WIDGETS_CONFIG.filter((dw) => !existingIds.has(dw.id)).map((dw, idx) => ({
      ...dw,
      orderIndex: widgetWithAppId.length + idx,
    }));
    if (missingDefaults.length > 0) {
      return [...widgetWithAppId, ...missingDefaults];
    }
    return widgetWithAppId;
  };
  return getWidgetsForApp;
});

export type UpdateDashboardWidgetsAction<T = any> =
  | {
      widgetId: string;
      appId: string;
      type: "update-properties";
      properties?: T;
    }
  | {
      widgetId: string;
      appId: string;
      type: "update-order";
      active: { widgetId: string; newIndex: number };
      over: { widgetId: string; newIndex: number };
    }
  | {
      widgetId: string;
      appId: string;
      type: "toggle-minimized";
    }
  | {
      widgetId: string;
      appId: string;
      type: "toggle-is-defined";
    };

export const dashboardWidgetsAtom = atom<null, [UpdateDashboardWidgetsAction], void>(
  (get) => null,
  (get, set, action) => {
    const widgetsConfig = get(getDashboardWidgetAtom);
    const mapResult = widgetsConfig ?? {};
    const widgetsConfigArray: SingleWidgetConfig[] = mapResult[action.appId] ?? DEFAULT_WIDGETS_CONFIG;

    const result = produce(widgetsConfigArray, (draft) => {
      let widgetIndex = draft.findIndex((w) => w.id === action.widgetId);
      if (widgetIndex === -1) {
        draft.push({
          id: action.widgetId,
          title: action.widgetId,
          type: "custom-events-chart",
          isMinimized: false,
          orderIndex: draft.length,
          isDefined: true,
        });
        widgetIndex = draft.length - 1;
      }

      if (action.type === "update-properties") {
        draft[widgetIndex].properties = action.properties;
      } else if (action.type === "update-order") {
        const activeWidget = draft.find((w) => w.id === action.active.widgetId);
        const overWidget = draft.find((w) => w.id === action.over.widgetId);
        if (activeWidget) {
          activeWidget.orderIndex = action.active.newIndex;
        }
        if (overWidget) {
          overWidget.orderIndex = action.over.newIndex;
        }
      } else if (action.type === "toggle-minimized") {
        draft[widgetIndex].isMinimized = !draft[widgetIndex].isMinimized;
      } else if (action.type === "toggle-is-defined") {
        draft[widgetIndex].isDefined = !draft[widgetIndex].isDefined;
        draft[widgetIndex].isMinimized = false;

        if (draft[widgetIndex].isDefined) {
          const areAllUserDefinedWidgetsDefined = draft
            .filter((w) => userDefinedWidgetTypes.includes(w.type))
            .every((w) => w.isDefined);
          if (areAllUserDefinedWidgetsDefined) {
            draft.push(
              produce(EMPTY_CUSTOM_EVENTS_CHART_WIDGET, (customEventsDraft) => {
                customEventsDraft.id = getNextWidgetId(widgetsConfigArray, customEventsDraft.id);
                customEventsDraft.orderIndex = widgetsConfigArray.length;
              })
            );
          }
        } else {
          const widgetsToRemoveIds = draft
            .filter((w) => userDefinedWidgetTypes.includes(w.type) && !w.isDefined && w.id !== action.widgetId)
            .map((w) => w.id);
          const widgetsToRemoveIndexes = widgetsToRemoveIds.map((id) => draft.findIndex((w) => w.id === id));
          widgetsToRemoveIndexes.forEach((toRemoveIndex) => {
            draft.splice(toRemoveIndex, 1);
          });
        }
      }
    });

    const allConfigs = produce(mapResult, (draftResult: any) => {
      draftResult[action.appId] = result;
    });
    set(getDashboardWidgetAtom, allConfigs);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allConfigs));
  }
);

const getNextWidgetId = (existingWidgets: SingleWidgetConfig[], baseId: string): string => {
  const pattern = new RegExp(`^${baseId}-(\\d+)$`);
  const existingNumbers = existingWidgets
    .map((widget) => {
      const match = widget.id.match(pattern);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((num): num is number => num !== null);

  const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
  return `${baseId}-${maxNumber + 1}`;
};
