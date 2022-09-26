# cloud-serverless-http

## Description
Node package that enables usage of backend frameworks over serverless functions.

## Usage

```shell
npm install cloud-serverless-http --save-exact
```

For projects that are using typescript, you'll need to install additional packages:
```shell
npm install @types/aws-lambda --save
npm install @types/node --save
```

```shell
# lambda.ts or lambda.js

import { createHandler } from 'cloud-serverless-http';

import { app } from './express-app';

export const handler = createHandler({ app });
```

You can check a full example with Express, Typescript, Inversify and CDK in [this repository](https://github.com/ionutmilica/cdk-serverless-example-app).
