import { useTranslation } from 'react-i18next';

import { saveUserLanguage } from '@/data/users';
import { isAppLanguage, languageNames, setAppLanguage, type AppLanguage } from '@/i18n';
import { saveFailed } from '@/state/notices';
import { useSession } from '@/state/session';
import { ChipGroup } from '@/ui';

/**
 * Idioma de la app para esta persona. Se aplica al tocarlo y se guarda en su cuenta, así que
 * no depende del idioma del móvil y la acompaña si cambia de teléfono.
 */
export function LanguagePicker() {
  const { t, i18n } = useTranslation();
  const uid = useSession((state) => state.user?.uid);

  const change = (language: AppLanguage) => {
    setAppLanguage(language);
    if (uid) saveUserLanguage(uid, language).catch(saveFailed('No se ha podido guardar el idioma'));
  };

  return (
    <ChipGroup<AppLanguage>
      label={t('settings.profile.languageLabel')}
      options={(Object.keys(languageNames) as AppLanguage[]).map((language) => ({
        value: language,
        label: languageNames[language],
      }))}
      value={isAppLanguage(i18n.language) ? i18n.language : 'es'}
      onChange={change}
    />
  );
}
