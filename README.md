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
## License

This project is licensed under the MIT License, see the [LICENSE](LICENSE) file for details
