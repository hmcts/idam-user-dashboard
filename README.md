# IdAM User Dashboard

## Purpose

IdAM User Dashboard is to be the new and improved replacement for the [IdAM web-admin](https://github.com/hmcts/idam-web-admin) service. IdAM User Dashboard will utilise a new techstack (NodeJS/ExpressJS/Nunjucks), bring a multitude of QoL improvements and intends to focus more on the user-management aspect of the IdAM web admin interface.

## Getting Started

### Prerequisites

Running the application requires the following tools to be installed in your environment:

  * [Node.js](https://nodejs.org/) `20.18.0` (see `.nvmrc`)
  * [yarn](https://yarnpkg.com/)
  * [Docker](https://www.docker.com)

### Running the application

#### Install dependencies:

```bash
$ yarn install
```

#### Managing dependencies:

To update the versions in package.json use:

```bash
$ yarn upgrade-interactive
```

and choose the appropriate version for each dependency.

The jenkins pipeline will check dependency versions for vulnerabilities. If you wish to suppress the issues that the pipeline is looking for you can populate the "yarn-audit-known-issues" file by running:

```bash
$ yarn npm audit --recursive --environment production --json > yarn-audit-known-issues
```

#### Generate assets bundle:

```bash
$ yarn build:prod
```

#### Run:

This application is configured to connect to services within AAT (idam-api and idam-web-public) by default.
Either connect to the VPN or set `STRATEGIC_PUBLIC_URL` and `STRATEGIC_SERVICE_URL` environment variables accordingly.

Use the following commands to start the application:
```bash
$ yarn start:dev  # Runs instance for local development
$ yarn start      # Runs production instance
```

The application's home page will be available at https://localhost:3100

### Running with Docker

Create docker image:

```bash
  docker-compose build
```

Run the application by executing the following command:

```bash
  docker-compose up
```

This will start the frontend container exposing the application's port
(set to `3100` in this template app).

## Developing

### Code style

We use [ESLint](https://github.com/typescript-eslint/typescript-eslint)
alongside [sass-lint](https://github.com/sasstools/sass-lint)

Running the linting with auto fix:
```bash
$ yarn lint --fix
```

### Running the tests

#### Run unit tests
You can run unit tests by executing the following command:

```bash
$ yarn test
```

#### Note for Playwright functional, cross-browser and accessibility tests

Before running the Playwright suites, make sure an instance of the app is running.
By default, the tests run against `https://idam-user-dashboard.aat.platform.hmcts.net/`,
but this can be changed by setting `TEST_URL`.

Playwright runtime prerequisites:

- Install browser binaries with `yarn playwright:install`
- Ensure the target app, IDAM API, and testing support API are reachable from the machine running the suite
- For AAT execution, make sure the required secrets are available in the environment or CI vault integration

Playwright test environment variables:

- Required for functional, cross-browser, and accessibility suites:
  - `FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET`
- Optional overrides for Playwright execution:
  - `TEST_URL`
    Defaults to `https://idam-user-dashboard.aat.platform.hmcts.net/`
  - `TEST_HEADLESS`
    Defaults to `true`
  - `SMOKE_TEST_USER_PASSWORD`
    Defaults to `Pa55word11` for test bootstrap if not provided
  - `TEST_ADMIN_EMAIL`
    Defaults to a generated `test...@admin.local` address per Playwright project
  - `BRANCH_NAME` and `BUILD_NUMBER`
    Used only to add build-specific suffixes to generated test data

If you are running the application locally rather than targeting AAT, the app itself may also need:

- `STRATEGIC_PUBLIC_URL`
- `STRATEGIC_SERVICE_URL`
- `TESTING_SUPPORT_URL`

#### Run functional tests
```bash
$ yarn test:functional
```

#### Run cross-browser tests
```bash
$ yarn test:crossbrowser
```

#### Run accessibility tests
```bash
$ yarn test:accessibility
```

#### Generate reports separately
```bash
$ yarn test:functional:allure
$ yarn test:crossbrowser:allure
$ yarn test:accessibility:report
```

## License

This project is licensed under the MIT License, see the [LICENSE](LICENSE) file for details.
