import { CountryConfiguration } from '../types/platformCore';

const COUNTRIES_KEY = 'soma_country_configurations';

const readLocal = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

export const countryManagementService = {
  /** Get supported country configurations */
  getCountries(): CountryConfiguration[] {
    const list = readLocal<CountryConfiguration[]>(COUNTRIES_KEY, []);
    if (list.length > 0) return list;

    const seed: CountryConfiguration[] = [
      {
        id: 'country_ke',
        countryCode: 'KE',
        name: 'Kenya',
        status: 'active',
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'sw'],
        defaultTimezone: 'Africa/Nairobi',
        currencyCode: 'KES',
        curriculumFrameworkIds: ['kicd_cbc_2024', 'kicd_844_kcse'],
        paymentProviderIds: ['mpesa_express', 'equity_bank_b2c'],
        enabledFeatureFlags: ['paperStudioEnabled', 'paperBankEnabled', 'assessmentDeliveryEnabled'],
        dataGovernancePolicyId: 'gov_ke_data_act_2019',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'country_ug',
        countryCode: 'UG',
        name: 'Uganda',
        status: 'pilot',
        defaultLanguage: 'en',
        supportedLanguages: ['en'],
        defaultTimezone: 'Africa/Kampala',
        currencyCode: 'UGX',
        curriculumFrameworkIds: ['ncdc_uganda_curriculum'],
        paymentProviderIds: ['mtn_mobile_money_ug', 'airtel_money_ug'],
        enabledFeatureFlags: ['paperStudioEnabled', 'assessmentDeliveryEnabled'],
        dataGovernancePolicyId: 'gov_ug_data_privacy_2019',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'country_tz',
        countryCode: 'TZ',
        name: 'Tanzania',
        status: 'curriculum_mapping',
        defaultLanguage: 'sw',
        supportedLanguages: ['sw', 'en'],
        defaultTimezone: 'Africa/Dar_es_Salaam',
        currencyCode: 'TZS',
        curriculumFrameworkIds: ['tie_tanzania_curriculum'],
        paymentProviderIds: ['vodacom_mpesa_tz', 'tigo_pesa_tz'],
        enabledFeatureFlags: ['paperStudioEnabled'],
        dataGovernancePolicyId: 'gov_tz_data_protection_2022',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    writeLocal(COUNTRIES_KEY, seed);
    return seed;
  },

  /** Resolve active country configuration */
  getCountryByCode(countryCode = 'KE'): CountryConfiguration {
    const countries = this.getCountries();
    return countries.find((c) => c.countryCode.toUpperCase() === countryCode.toUpperCase()) || countries[0];
  },
};
