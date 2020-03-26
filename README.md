# freee-app-template-firebase

このアプリは Firebase 上で動作する [freee SDK](https://github.com/freee/firebase-sdk-js) を利用して、
認証や API コールを行うサンプルコードを実装したものです。

## サンプルアプリでできること

- freee ログイン画面へリダイレクト -> 認可 -> コールバックで user 情報を Firebase に保存 -> ホーム画面へ遷移
- ログアウト
- 事業所情報の読み込み (GET api/1/users/me)
- 取引情報の登録 (POST api/1/deals)
- アクセストークン、リフレッシュトークンの暗号化と key rotation

## 実行環境

Windows環境はサポートしておりません。

## フォルダ構成
静的ファイルを所有する任意のドメインで配布する [Firebase Hosting](https://firebase.google.com/docs/hosting/?hl=ja) から [Firebase Cloud Functions](https://firebase.google.com/docs/functions?hl=ja) を call して、 freee API や [Cloud FireStore](https://firebase.google.com/docs/firestore?hl=ja)（NoSQL database）にアクセスしてアプリが動作します。

Firebase での Web アプリ作成については[公式リファレンス](https://firebase.google.com/docs/web/setup?hl=ja)もご参照ください。 

```
Root
├ hosting .. Firebase Hosting にデプロイされるソースのルートフォルダ
├ functions .. Firebase Cloud Functions にデプロイされるソースのルートフォルダ
　　 ├ config .. 各種 configuration
　　 ├ config.xxxx.json .. SDKConfig 用の設定情報
　　 ├ service-account.json .. Service Account credential file for firebase
```

## 開発環境のセットアップ

### Step1: project 作成
① git clone 


```
$ git clone https://github.com/freee/freee-app-template-firebase.git
$ cd freee-app-template-firebase
```

② firebase-tools をインストール  
`npm install -g firebase-tools@7.12.1`

③ firebase にログイン  
`firebase login`  
認証画面に遷移するので承認してください。

④ firebase のコンソールでアプリを作成
https://console.firebase.google.com/u/0/?hl=ja

Firestore、Storage デプロイ時にエラーになるため、サイドバーからそれぞれの画面に遷移してアクティベートしておいてください。
ロケーションは特別な理由がない限り`asia-northeast1`で統一してくだだい(Firestore のロケーションは後から変更できないので注意)

⑤ firebase プロジェクトを紐付け  
`firebase init` を行い、案内にしたがって設定を行います。

-  どの機能を利用するか聞かれるので、`Firestore, Functions, Hosting, Storage`を選択  
-  firebase プロジェクトを新規作成するか、作成したものを選択するか聞かれるので、先ほど作成したプロジェクトを選択  
-  functions の言語を聞かれるので、typescript を選択  
-  tslint を適用するか聞かれるので、yes を選択  
-  npm install を今行うか聞かれるので、no を選択  
-  その他上書きが発生する場合は、全て no を選択

⑥ freee アプリストアでアプリを作成する  
  
[こちら](https://app.secure.freee.co.jp/developers/demo_companies/description)を参考にしながらアプリを作成してください。  
コールバック URL は `http://localhost:5001/{{project-id}}/us-central1/api/auth/callback` にしてください。

### Step2: Cloud Functions の設定

Cloud Functions はサーバーレスで実行できる関数で、ローカルで動かすこともできます。
ここでは、ローカルで Cloud Functions を動作させる手順を紹介します。

① `functions/.runtimeconfig.json` を準備する  
以下のように設定してください。
`env.mode`は`functions/src/config/config.xxx.json`の環境ごとの読み分けに利用する変数です。

```
{
  "env": {
    "serviceaccountpath": "config/service-account.local.json",
    "mode": "local"
  },
  "freee": {
    "client_id": "登録したfreeアプリのclient_id",
    "client_secret": "登録したfreeアプリのclient_secret"
  }
}
```

※ runtimeconfig は Cloud Functions をローカルで動作させる場合のみ function に反映されます。
デプロイ時は[こちら](https://firebase.google.com/docs/functions/config-env#set_environment_configuration_for_your_project)を参考に、環境変数を設定してください。

② サービスアカウント認証用ファイルを準備する
[こちらのリンク](https://firebase.google.com/docs/auth/web/custom-auth?hl=ja) を参考に json file をダウンロードし、 `functions/src/config/service-account.local.json` というファイルで保存してください。

`service-account.local.json` の中身の例

```
{
  "type": "service_account",
  "project_id": "sample-pjt-xxx",
  "private_key_id": "xxx",
  "private_key": "xxx",
  "client_email": "xxx",
  "client_id": "xxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "xxx"
}

```

③ サービス固有の設定ファイルを準備する
`functions/src/config/config.local.json` に以下のファイルを準備してください。

```
{
  "freee": {
    "authHost": "http://localhost:5001/sample-pjt-freee/us-central1/api/auth",
    "appHost": "http://localhost:5000",
    "homePath": "/home",
    "tokenHost": "https://accounts.secure.freee.co.jp",
    "apiHost": "https://api.freee.co.jp"
  },
  "firebase": {
    "apiKey": "{{project-api-key}}",
    "cryptoKeyBucket": "{{project-id}}.appspot.com"
  }
}
```

### step3: Firebase Hosting の設定
Firebase Hosting は静的なファイル（HTML, JavaScript等）をデプロイして任意のドメインで公開できるホスティングサービスです。
このアプリでは Firebase Hosting から Cloud Functions をコールして、アプリを動作させています。

① .env の設定
hosting/.env に以下の設定を記載してください。

```
# functions の URL
CLOUD_FUNCTION_HOST=http://localhost:5001/{{project-id}}/us-central1

# fucntionsのonCall呼び出しをローカルで動かす時に必要設定(CORSエラー対策)
CLOUD_FUNCTION_LOCAL_HOST=http://localhost:5001

# src/firebase/firebase_app で利用する設定ファイルを分岐させるため
REACT_APP_APP_ENV=local

# hosting が接続する functions のリージョンを指定する
HOSTING_REQUEST_FUNCTIONS_REGION=us-central1

# 会計 freee のドメイン
CFO_DOMAIN=https://secure.freee.co.jp
```

### step4: project の起動
 
① `npm run setup` を実行する

② `npm start` を実行し、`http://localhost:5000` （hosting のURL）にアクセスする

## デプロイ（本番環境で動作させる）

### project 作成
本番用に改めて firebase project と freee のアプリを作成してください。
firebase project を作成したら、コマンドラインからプロジェクトの切り替えを行います。

```
$ firebase use {{project-id}}
```

また、freee のアプリのコールバック URL には、以下を設定してください。

`https://asia-northeast1-{{project-id}}.cloudfunctions.net/api/auth/callback`

### production 用の Cloud Functions の設定
ローカル環境用に設定した functions の設定ファイルについても、 production 用に作成する必要があります。

- `service-account.production.json`
- `functions/src/config/config.production.json`

`functions/src/config/config.production.json` の設定例

```
{
  "freee": {
    "authHost": "https://asia-northeast1-{{project-id}}.cloudfunctions.net/api/auth",
    "appHost": "{{hosting-url}}/home",
    "homePath": "/select_company",
    "tokenHost": "https://accounts.secure.freee.co.jp",
    "apiHost": "https://api.freee.co.jp"
  },
  "firebase": {
    "apiKey": "{{project-api-key}}",
    "cryptoKeyBucket": {{project-id}}.appspot.com"
  }
}
```

またローカル以外で Cloud Functions を動作させるためには、`.runtimeconfig.json` の内容を functions に設定する必要があります。[こちらのリンク](https://firebase.google.com/docs/functions/config-env#set_environment_configuration_for_your_project)を参考に functions の環境変数設定を行う必要があります。
以下を参考にコマンドラインから設定してください。

```
$ firebase functions:config:set env.mode=production env.region="asia-northeast1" freee.client_id=xxx freee.client_secret=xxx env.serviceaccountpath="config/service-account.json"
```

### デプロイの実行

`npm run deploy` を実行してください。

## FAQ

Q. Firebase の料金プランはどうしたら良いか？  
A. Blaze プランにする必要があります。freee の API は外部の API にあたり、functions 上からの接続には Blaze プランにする必要があります。

