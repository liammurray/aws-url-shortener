# Url Shortner

Simple API GW url shortener service example using:

- AWS SAM/CDK for deploying build pipeline and API
  - CDK currently doesn't work for CI (CDK doesn't support yet)
- Typescript
- DynamoDb using [dynamodb-datamapper-js](https://github.com/awslabs/dynamodb-data-mapper-js)

## Dependencies

Get makefile helpers (e.g., parallel to this project)

```bash
git clone https://github.com/liammurray/maketools.git
```

Edit Makefile so MAKETOOLS points to this:

Note: You could also just use SAM command with SAM template (skip makefiles)

## Quickstart

See [CDK README](./infra/README.md) for CI setup.

The following will build and deploy manually. It uses SAM by default. See Makefile.

```bash
make deploy
curl -X POST  https://u.example.com?url=https://www.google.com
```

To just build (verify code builds locally)

```bash
make build
make test
```

## TODO

- Support custom name as in: `http://u.example.com/custom_name`
- Validate submitted URL
- Expiration
- Frontend (React)

## Local

### Dynamo

Run local database

```bash
   docker run -p 8000:8000 -d --name dynamodb amazon/dynamodb-local
   aws dynamodb list-tables --endpoint-url http://localhost:8000
```

Create table (name in JSON should match naem in template.yml)

```bash
 aws dynamodb create-table --cli-input-json file://tools/json/create-urls-table.json --endpoint-url http://localhost:8000
```

Cleanup

```bash
 aws dynamodb delete-table --table-name UrlEntries-dev --endpoint-url http://localhost:8000
 docker stop dynamodb
```

### API Gateway

```bash
   make build
   make api
   curl -X GET -s http://127.0.0.1:3000/123 | jq
   curl -X POST -s http://127.0.0.1:3000/url?url=https://www.google.com
   curl -kv -X GET -s http://127.0.0.1:3000/<shortid>
```
