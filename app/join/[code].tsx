import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { normalizeInviteCode } from '@/domain/invites';
import { useSession } from '@/state/session';

/**
 * Destino del enlace de invitación (`navana://join/CÓDIGO`). Guarda el código y deja
 * que el router lleve a donde toque: a iniciar sesión, a unirse al hogar o, si ya
 * tiene uno, a la app.
 */
export default function JoinLinkScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const setPendingInviteCode = useSession((state) => state.setPendingInviteCode);

  useEffect(() => {
    setPendingInviteCode(normalizeInviteCode(code ?? ''));
    router.replace('/');
  }, [code, router, setPendingInviteCode]);

  return null;
}
