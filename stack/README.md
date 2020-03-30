# Url shortener CDK

## Quickstart

```bash
make lambda
cd ./stack
cdk deploy
curl -X POST  https://u.nod15c.com/?url=https://www.google.com
cdk destroy
```

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
