# Url shortener CDK

## Quickstart

Create a `.env`

```bash
ACCOUNT="<account>"
REGION="us-west-2"
CERT_ID="<id>"
DNS_NAME="u.example.com"
STAGE="dev"
```

Deploy (from root). It will build lambdas and run cdk command for you.

```bash
make deploy
```

The make deploy step runs `cdk deploy` in this directory. See makefile.

You can also build and then run stack here.

```bash
make build
cd ./stack
cdk deploy
```

Test

```bash
curl -X POST  https://u.nod15c.com/?url=https://www.google.com
cdk destroy
```
