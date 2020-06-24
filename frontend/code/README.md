# URL Shortener

Uses Amplify and Antd.

Once the backend is deployed (Cognito and API) run the following to generate or update the Amplify config file based on outputs from the Cloudformation stacks. There are some naming assumptions.

```bash
./gen-amplify-config.py
```

# Setup

Create

```bash
npx create-react-app webapp --typescript
```

Install Amplify CLI:

```bash
npm i -g @aws-amplify/cli
```

Install Amplify library to your project

```bash
npm i aws-amplify @aws-amplify/ui-react
```

```bash
amplify configure
```

See [Amplify getting started](https://aws-amplify.github.io/docs/js/start)
[Workshop Amplify React](https://github.com/dabit3/aws-amplify-workshop-react)

Reference:

[Typescript react](https://levelup.gitconnected.com/typescript-and-react-using-create-react-app-a-step-by-step-guide-to-setting-up-your-first-app-6deda70843a4)

[Add Redux](https://medium.com/backticks-tildes/setting-up-a-redux-project-with-create-react-app-e363ab2329b8)

[Some guy on sam and amplify](https://www.devalias.net/devalias/2018/09/15/forming-serverless-clouds-aws-cloudformation-sam-cdk-amplify/)

Other stuff:

```bash
# https://medium.com/technoetics/create-basic-login-forms-using-create-react-app-module-in-reactjs-511b9790dede
npm install --save material-ui axios react-tap-event-plugin
```
