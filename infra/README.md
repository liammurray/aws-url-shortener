# Url shortener CDK

This directory deploys:

- Build pipeline for CI/CD that deploys API
- Cognito user pool
- The API itself

You can see these stacks by running the following:

```bash
npm ci
npm run cdk list
```

_NOTE:_

Do not deploy the pipeline for now. Deploy the API manually using:

`cdk deploy urls-api-dev`

This is because the CDK API deploy creates the route53 entry for the API in addition to deploying the API.

Currently the CDK does not support API deployment via CI very well. We are awaiting this [cdk asset fix](https://github.com/aws/aws-cdk-rfcs/issues/92).

The current pipeline is configured to deploy the API using the SAM template, but unfortunately that doesn't create the route53 entry.

Once asset fix is supported we can fix buildspec.yml and use that (instead of buildspec-sam) in the pipeline.

## Build the lambda function code

The code is referenced by the CDK stack for the API created in this directory.

```bash
cd ..
make build
make utest
```

## Setup environment

Environment points to things like npm token, codebuild token, ACM domain cert, etc.

- Look at `main.ts` and notice a few SSM params that need to be set/passed (domain and cert). These should be configured (or override with hardcoded values, etc.)
- Look at `main.ts` where the build pipeline is created. There are some additional env values obtained via SSM by default. These can be configured or overriden.

## Verify you can build and synth the CFN templates

```bash
make build
make utest
npm run cdk list
```

## Setup Cognito

This is deployed manually.

```bash
npm run cdk deploy urls-cognito-dev
```

## Setup CI

This needs to be run whenever you make changes to pipeline stack. The pipeline is deployed manually.

```bash
npm run cdk deploy urls-build-pipeline-master
```

Push a commit to trigger build deploy to dev. The CI will deploy the API target from this directory (see buildspec.yml).

## Test

```bash
curl -X POST  https://u.nod15c.com/?url=https://www.google.com
npm run cdk destroy urls-build-pipeline-master
```

## Destroy

Run `cdk destroy`. Destroy API, then pipeline, then cognito.

If you are unable to delete a stack (because the role used to create the stack does not exist) it probably means you deleted the CDK stack that created the role that was used to ddeploy the stack. In this case copy the role name for the stack. Create a new CloudFormation role with that name, delete the stack, then remove the temporary role.
