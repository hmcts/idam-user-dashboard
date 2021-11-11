# IdAM User Dashboard

## Purpose

IdAM User Dashboard is to be the new and improved replacement for the [IdAM web-admin](https://github.com/hmcts/idam-web-admin) service. IdAM User Dashboard will utilise a new techstack (NodeJS/ExpressJS/Nunjucks), bring a multitude of QoL improvements and intends to focus more on the user-management aspect of the IdAM web admin interface.

**STILL IN DEVELOPMENT**

## Getting Started

### Prerequisites

Running the application requires the following tools to be installed in your environment:

  * [Node.js](https://nodejs.org/) v12.0.0 or later
  * [yarn](https://yarnpkg.com/)
  * [Docker](https://www.docker.com)

### Running the application

Install dependencies by executing the following command:

 ```bash
$ yarn install
 ```
Bundle:

```bash
$ yarn webpack
```

Run:

```bash
$ yarn start
```

The applications's home page will be available at https://localhost:3100

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

In order to test if the application is up, you can visit https://localhost:3100 in your browser.
You should get a very basic home page (no styles, etc.).

## Developing

### Code style

We use [ESLint](https://github.com/typescript-eslint/typescript-eslint)
alongside [sass-lint](https://github.com/sasstools/sass-lint)

Running the linting with auto fix:
```bash
$ yarn lint --fix
```

### Running the tests

This template app uses [Jest](https://jestjs.io//) as the test engine. You can run unit tests by executing
the following command:

```bash
$ yarn test
```

Here's how to run functional tests (the template contains just one sample test):

```bash
$ yarn test:routes
```

Running accessibility tests:

```bash
$ yarn test:a11y
```

Make sure all the paths in your application are covered by accessibility tests (see [a11y.ts](src/test/a11y/a11y.ts)).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
