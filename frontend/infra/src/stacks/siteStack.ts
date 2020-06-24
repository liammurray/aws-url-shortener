import * as cdk from '@aws-cdk/core'
import { StaticSite, StaticSiteProps } from '../constructs/staticSite'

export interface SiteStackProps extends cdk.StackProps {
  // Required for route53 hosted zone lookup (can't use environment generic stack)
  readonly env: cdk.Environment
  readonly siteProps: StaticSiteProps
}

export default class SiteStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: SiteStackProps) {
    super(scope, id, props)

    new StaticSite(this, 'StaticSite', props.siteProps)
  }
}
