import env from 'env-var'
import pino from 'pino'

export function envStr(key: string): string {
  return env.get(key).required().asString()
}

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  name: envStr('SERVICE_NAME'),
})

export function arnSlice(
  arn: string,
  start?: number | undefined,
  end?: number | undefined
): string {
  if (arn == null) return ''
  return arn.split(':').slice(start, end).join(':')
}

/**
 * Parses 'resourcetype/resource' or 'resource' (but not resourcetype:resource)
 * https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#genref-arns
 */
export type ArnResource = {
  type: string | undefined
  resource: string
}

export function arnResource(arn: string): ArnResource {
  // task-definition/mock-appserver_latest:37
  // targetgroup/alb-group-ecs-appserver-test/8d3735eb21928f06
  const tail = arnSlice(arn, 5)
  const delim = tail.indexOf('/')
  if (delim === -1) {
    // resource only
    return { type: undefined, resource: tail }
  }
  return { type: tail.slice(0, delim), resource: tail.slice(delim + 1) }
}

export function nameFromArn(arn: string): string {
  return arnResource(arn).resource
}
