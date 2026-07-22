/**
 * Telegram WebApp & Bot Integration Service for Somo Smart
 * Enables running Somo Smart as a native Telegram Mini App (TWA),
 * seamlessly authenticating Telegram users, and sharing revision content across Telegram channels.
 */

export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
}

export interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
        query_id?: string;
        user?: TelegramUser;
        auth_date?: number;
        hash?: string;
    };
    version: string;
    platform: string;
    colorScheme: 'light' | 'dark';
    themeParams: Record<string, string>;
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    headerColor: string;
    backgroundColor: string;
    isClosingConfirmationEnabled: boolean;
    BackButton: {
        isVisible: boolean;
        show: () => void;
        hide: () => void;
        onClick: (callback: () => void) => void;
    };
    MainButton: {
        text: string;
        color: string;
        textColor: string;
        isVisible: boolean;
        isActive: boolean;
        isProgressVisible: boolean;
        setText: (text: string) => void;
        onClick: (callback: () => void) => void;
        show: () => void;
        hide: () => void;
        enable: () => void;
        disable: () => void;
        showProgress: (leaveActive?: boolean) => void;
        hideProgress: () => void;
    };
    HapticFeedback: {
        impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
        notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        selectionChanged: () => void;
    };
    ready: () => void;
    expand: () => void;
    close: () => void;
    openTelegramLink: (url: string) => void;
    openLink: (url: string) => void;
}

declare global {
    interface Window {
        Telegram?: {
            WebApp?: TelegramWebApp;
        };
    }
}

export const TELEGRAM_BOT_USERNAME = 'SomoSmartBot';
export const TELEGRAM_CHANNEL_URL = 'https://t.me/somosmart_kenya';

export class TelegramService {
    /**
     * Checks if the app is currently running inside Telegram WebApp
     */
    static isTelegramWebApp(): boolean {
        return Boolean(window.Telegram?.WebApp?.initData);
    }

    /**
     * Returns the Telegram WebApp instance if available
     */
    static getWebApp(): TelegramWebApp | null {
        return window.Telegram?.WebApp || null;
    }

    /**
     * Initializes the Telegram WebApp environment
     */
    static init(): void {
        const webApp = this.getWebApp();
        if (!webApp) return;

        try {
            webApp.ready();
            webApp.expand();
            console.log('[TelegramService] Initialized Telegram WebApp v' + webApp.version + ' on platform: ' + webApp.platform);
        } catch (err) {
            console.warn('[TelegramService] Could not initialize WebApp:', err);
        }
    }

    /**
     * Retrieves current Telegram user profile if running inside Telegram
     */
    static getTelegramUser(): TelegramUser | null {
        const webApp = this.getWebApp();
        return webApp?.initDataUnsafe?.user || null;
    }

    /**
     * Triggers native haptic feedback
     */
    static haptic(style: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'medium'): void {
        const webApp = this.getWebApp();
        if (!webApp?.HapticFeedback) return;

        try {
            if (style === 'success' || style === 'error') {
                webApp.HapticFeedback.notificationOccurred(style);
            } else {
                webApp.HapticFeedback.impactOccurred(style);
            }
        } catch {
            // Ignore if haptics fail
        }
    }

    /**
     * Opens direct Telegram link or bot command
     */
    static openBot(startParam?: string): void {
        const url = startParam
            ? `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${encodeURIComponent(startParam)}`
            : `https://t.me/${TELEGRAM_BOT_USERNAME}`;

        const webApp = this.getWebApp();
        if (webApp) {
            webApp.openTelegramLink(url);
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    }

    /**
     * Joins the official Somo Smart Telegram Revision Channel
     */
    static joinChannel(): void {
        const webApp = this.getWebApp();
        if (webApp) {
            webApp.openTelegramLink(TELEGRAM_CHANNEL_URL);
        } else {
            window.open(TELEGRAM_CHANNEL_URL, '_blank', 'noopener,noreferrer');
        }
    }

    /**
     * Shares content to Telegram chats/groups
     */
    static shareContent(title: string, text: string, shareUrl?: string): void {
        const targetUrl = shareUrl || window.location.href;
        const fullMessage = `${title}\n${text}\n${targetUrl}`;
        const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(title + '\n' + text)}`;

        const webApp = this.getWebApp();
        if (webApp) {
            webApp.openTelegramLink(telegramShareUrl);
        } else {
            window.open(telegramShareUrl, '_blank', 'noopener,noreferrer');
        }
    }
}

export default TelegramService;
