# Url shortener CDK

This directory deploys:

    - Build pipeline for CI/CD that deploys API
    - API itself

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
make cdk list
make cdk urls-build-pipeline-master
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
