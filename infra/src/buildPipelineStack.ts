import * as cdk from '@aws-cdk/core'
import { BuildPipeline, makeBaseProps } from '@liammurray/cdk-common'

export default class BuildPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const pipelineOpts = makeBaseProps(this, 'UrlShortener', 'master')
    new BuildPipeline(this, 'BuildPipeline', {
      ...pipelineOpts,
      // Remove once in ssm under /cicd/UrlShortner/github/repo
      repo: 'aws-url-shortener',
    })
  }
}
