import * as path from 'path';
import * as nunjucks from 'nunjucks';
import { createHash } from 'crypto';
import { Express, Request, Response } from 'express';
import { Helmet } from '../../../../main/modules/helmet';

describe('Shared page template', () => {
  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader([
    path.join(__dirname, '../../../../main/views'),
    path.join(__dirname, '../../../../../node_modules/govuk-frontend')
  ]), { autoescape: true });
  const template = '{% extends "template.njk" %}{% block head %}{% endblock %}{% block bodyEnd %}{% endblock %}';
  const urls = { ACCESSIBILITY_STATEMENT: '/accessibility-statement' };

  test.each([
    { user: undefined, href: '/login', label: 'Sign in', absentLabel: 'Sign out' },
    { user: { name: 'Test Administrator' }, href: '/logout', label: 'Sign out', absentLabel: 'Sign in' }
  ])('Preserves the $label link in service navigation', ({ user, href, label, absentLabel }) => {
    const html = env.renderString(template, { user, urls });
    const navigation = html.match(/<section aria-label="Service information"[\s\S]*?<\/section>/)?.[0];

    expect(navigation).toContain('IDAM User Dashboard');
    expect(navigation).toContain('href="/"');
    expect(navigation).toContain('aria-label="Account"');
    expect(navigation).toContain(`href="${href}"`);
    expect(navigation).toContain(label);
    expect(navigation).not.toContain(absentLabel);
    if (user) {
      expect(navigation).toContain(user.name);
    }
  });

  test('Escapes the signed-in user name', () => {
    const html = env.renderString(template, { user: { name: '<script>alert("user")</script>' }, urls });

    expect(html).toContain('&lt;script&gt;alert(&quot;user&quot;)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert("user")</script>');
  });

  test('Renders the GOV.UK logo in the Generic header and preserves page landmarks and footer links', () => {
    const html = env.renderString(template, { urls });
    const header = html.match(/<header\b[\s\S]*?<\/header>/)?.[0];

    expect(html.match(/<header\b/g)).toHaveLength(1);
    expect(html.match(/<footer\b/g)).toHaveLength(1);
    expect(header).toContain('govuk-generic-header__homepage-link');
    expect(header).toContain('href="https://www.gov.uk/"');
    expect(header).toContain('govuk-header__logotype');
    expect(header).toContain('aria-label="GOV.UK"');
    expect(header).toContain('<title>GOV.UK</title>');
    expect(header).toContain('govuk-logo-dot');
    expect(header).not.toContain('HM Courts &amp; Tribunals Service');
    expect(header).not.toContain('app-header--black');
    expect(html).toContain('href="/accessibility-statement"');
    expect(html).toContain('Accessibility statement');
    expect(html).toContain('href="/assets/manifest.json"');
    expect(html).toContain('href="#main-content"');
    expect(html).toContain('id="main-content"');
  });

  test('Renders the phase banner inside the header and breadcrumbs before main content', () => {
    const page = '{% extends "manage-user.njk" %}{% block head %}{% endblock %}{% block bodyEnd %}{% endblock %}';
    const html = env.renderString(page, { urls, error: {} });
    const phaseBanner = html.indexOf('class="govuk-phase-banner ');
    const headerEnd = html.indexOf('</header>');
    const breadcrumbs = html.indexOf('aria-label="Breadcrumb"');
    const main = html.indexOf('<main ');

    expect(html.match(/class="govuk-phase-banner /g)).toHaveLength(1);
    expect(phaseBanner).toBeGreaterThan(html.indexOf('<header '));
    expect(phaseBanner).toBeLessThan(headerEnd);
    expect(breadcrumbs).toBeGreaterThan(headerEnd);
    expect(breadcrumbs).toBeLessThan(main);
    expect(html).not.toContain('aria-labelledby="phaseBannerHeading"');
  });

  test('Allows the rendered page support and report scripts under the production CSP', () => {
    const app = { locals: { ENV: 'production' }, use: jest.fn() };
    new Helmet({ referrerPolicy: 'origin' }).enableFor(app as unknown as Express);
    const response = { setHeader: jest.fn() };
    const cspMiddleware = app.use.mock.calls[1][0];
    cspMiddleware({} as Request, response as unknown as Response, jest.fn());
    const policy = response.setHeader.mock.calls.find(([name]) => name === 'Content-Security-Policy')?.[1];
    const page = '{% extends "view-report.njk" %}{% block head %}{% endblock %}{% block bodyEnd %}{% endblock %}';
    const html = env.renderString(page, {
      urls, error: {}, content: { query: [], reportUUID: 'sample', reportData: [] }
    });
    const scripts = Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/g), match => match[1]);

    expect(scripts).toHaveLength(3);
    for (const script of scripts) {
      const hash = createHash('sha256').update(script).digest('base64');
      expect(policy).toContain(`'sha256-${hash}'`);
    }
    expect(policy).not.toContain("'unsafe-inline'");
  });
});
