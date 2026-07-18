declare global {
  namespace App {
    interface Platform {
      env: {
        PUBLIC_WAZOO_API_BASE_URL?: string;
        PUBLIC_TURNSTILE_SITE_KEY?: string;
        WAZOO_PLATFORM_ADMIN_TOKEN?: string;
      };
    }
    interface Locals {
      auth: string;
      apiBaseUrl: string;
    }
  }
}

export {};
