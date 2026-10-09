import * as path from 'path';
import * as nunjucks from 'nunjucks';
import { InvitationStatus, InvitationTypes } from '../../../../main/app/invite-service/Invite';

describe('Invitation results view', () => {
  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader([
    path.join(__dirname, '../../../../main/views'),
    path.join(__dirname, '../../../../../node_modules/govuk-frontend')
  ]), { autoescape: true });
  const template = '{% extends "invitation-results.njk" %}{% block head %}{% endblock %}{% block bodyEnd %}{% endblock %}';
  const removalMessage = 'The user account has most likely been removed.';
  const registrationMessage = 'The user will appear in user search after the invitation process is completed and the account is created.';
  const invitation = {
    id: 'test-invitation-id',
    userId: 'test-user-id',
    email: 'test@example.com',
    invitationType: InvitationTypes.INVITE,
    invitationStatus: InvitationStatus.ACCEPTED,
    createDate: 'Wed, 03 Jun 2026 10:00:00 GMT'
  };

  test.each([
    { searchType: 'email', search: { email: invitation.email } },
    { searchType: 'user ID', search: { userId: invitation.userId } }
  ])('Should show likely removal for a $searchType search without the registration message', ({ search }) => {
    const html = env.renderString(template, {
      content: { ...search, userLikelyRemoved: true, invitationCount: 1, invitations: [invitation] },
      urls: {}
    });

    expect(html).toContain('An invitation has been accepted, but no established user account was found.');
    expect(html).toContain(removalMessage);
    expect(html).not.toContain(registrationMessage);
    expect(html).toContain(invitation.id);
    expect(html).toContain(InvitationStatus.ACCEPTED);
  });

  test.each([InvitationStatus.PENDING, InvitationStatus.EXPIRED, InvitationStatus.REVOKED, InvitationStatus.ACCEPTED])(
    'Should preserve the registration message for %s results without the likely removal flag', status => {
      const html = env.renderString(template, {
        content: {
          email: invitation.email,
          userLikelyRemoved: false,
          invitationCount: 1,
          invitations: [{ ...invitation, invitationStatus: status }]
        },
        urls: {}
      });

      expect(html).toContain(registrationMessage);
      expect(html).not.toContain(removalMessage);
    }
  );
});
