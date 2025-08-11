# IdAM User Dashboard

## Purpose

IdAM User Dashboard is to be the new and improved replacement for the [IdAM web-admin](https://github.com/hmcts/idam-web-admin) service. IdAM User Dashboard will utilise a new techstack (NodeJS/ExpressJS/Nunjucks), bring a multitude of QoL improvements and intends to focus more on the user-management aspect of the IdAM web admin interface.

## Getting Started

### Prerequisites

Running the application requires the following tools to be installed in your environment:

  * [Node.js](https://nodejs.org/) v12.0.0 or later
  * [yarn](https://yarnpkg.com/)
  * [Docker](https://www.docker.com)

### Running the application

#### Install dependencies:

```bash
$ yarn install
```

Test

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

#### Note for functional and accessibility tests

Before running the functional tests and accessibility tests, make sure that an instance of the app is running.
By default, the tests will run against an instance hosted at https://localhost:3100,
but this can be changed by setting the `TEST_URL` environment variable.

Due to a reliance on 3rd party services, you also need to set
`LAUNCHDARKLY_SDK_KEY`
`NOTIFY_API_KEY`
`SMOKE_TEST_USER_USERNAME`
`SMOKE_TEST_USER_PASSWORD`
environment variables accordingly.

#### Run functional tests
```bash
$ yarn test:functional:min    # Runs minimum functional tests (path-to-live)
$ yarn test:functional:all    # Runs all functional tests (nightly)
```

#### Running accessibility tests:

```bash
$ yarn test:pa11y
```

## License

This project is licensed under the MIT License, see the [LICENSE](LICENSE) file for details.
