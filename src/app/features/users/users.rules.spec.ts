/**
 * The two rules that stop an administrator locking everyone out.
 *
 * Extracted as pure functions so the guarantee is testable without standing up
 * the component or Keycloak.
 */
export function blockedReason(
  target: { id: string; isAdmin: boolean },
  action: 'promote' | 'demote' | 'delete',
  currentUserId: string,
  adminCount: number,
): string | null {
  if (target.id === currentUserId) {
    return action === 'delete'
      ? 'You cannot delete your own account.'
      : 'You cannot change your own role.';
  }
  if (action === 'demote' && target.isAdmin && adminCount <= 1) {
    return 'This is the last administrator. Promote someone else first.';
  }
  return null;
}

describe('user management guards', () => {
  const me = 'user-1';
  const other = { id: 'user-2', isAdmin: false };
  const otherAdmin = { id: 'user-2', isAdmin: true };

  it('refuses deleting your own account', () => {
    expect(blockedReason({ id: me, isAdmin: true }, 'delete', me, 2)).toContain('own account');
  });

  it('refuses changing your own role', () => {
    // Otherwise an admin can demote themselves and immediately lose the screen.
    expect(blockedReason({ id: me, isAdmin: true }, 'demote', me, 2)).toContain('own role');
  });

  it('refuses demoting the last administrator', () => {
    // A realm with no admin is only recoverable from the Keycloak console.
    expect(blockedReason(otherAdmin, 'demote', me, 1)).toContain('last administrator');
  });

  it('allows demoting an admin while others remain', () => {
    expect(blockedReason(otherAdmin, 'demote', me, 3)).toBeNull();
  });

  it('allows promoting another account', () => {
    expect(blockedReason(other, 'promote', me, 1)).toBeNull();
  });

  it('allows deleting another account', () => {
    expect(blockedReason(other, 'delete', me, 1)).toBeNull();
  });
});
