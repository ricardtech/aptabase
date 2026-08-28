const regions: { [host: string]: "eu" | "us" } = {
  "us.aptabase.com": "us",
  "eu.aptabase.com": "eu",
};

export const hourCycle: "h12" | "h24" = "h24";
export const isDevelopment = import.meta.env.DEV;
export const region: string | undefined = regions[window.location.hostname];
export const isManagedCloud = !!region;
export const isBillingEnabled = isManagedCloud || isDevelopment;
export const isSupportEnabled = isManagedCloud || isDevelopment;
