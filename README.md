# Url Shortner

Simple API GW url shortener service example using:

- AWS SAM/CDK
- Typesript
- DynamoDb using [dynamodb-datamapper-js](https://github.com/awslabs/dynamodb-data-mapper-js)

## Dependencies

Get makefile helpers (e.g., parallel to this project)

```bash
git clone https://github.com/liammurray/maketools.git
```

Edit Makefile so MAKETOOLS points to this:

Note: You could also just use SAM command with SAM template (skip makefiles)

## Quickstart

See [CDK README](./stack/README.md) to set `.env` to use CDK. This way will create DNS entry and setup certificate.

This is enabled by default. See Makefile in this directory.

The following will build and deploy.

```bash
make deploy
curl -X POST  https://u.example.com?url=https://www.google.com
```

To just build

```bash
make build
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
