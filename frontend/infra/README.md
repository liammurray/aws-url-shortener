# Deployment stack for URL Shortener React App

## Unit tests

1.  Build code (for BucketDeployment construct)

    ```bash
    cd ../code
    npm ci && npm run build
    ```

1.  Run test

    ```bash
    npm run test
    ```

_Note_ Run the snapshot test from time to time. It is disabled because it fails frequently on small changes we don't care about.

To update snapshot (after you known changes are correct):

```bash
npm run test -- -u
```

## Deploy manually

Build code so `../code/build` exists.

```bash
npm run cdk deploy urlshort-site
```

This takes time the first time.

## Destroy

Deploy bucket content should be manually removed prior to this (so bucket can be deleted).

```bash
npm run cdk destory urlshort-site
```

## TODO

CodeBuild project

1.  Filters on path to /frontend
1.  Runs /frontend/buildspec.yaml
1.  Build phase:
    1.  cd code
    1.  npm run lint build test
1.  Deploy phase
    1.  cd infra
    1.  npm run lint build test
    1.  npm run cdk synth <stack-name>
    1.  cfn deploy output.json (from prev step)

The synth/deploy can be used for CodePipeline approval (prod), e.g.

```

```
