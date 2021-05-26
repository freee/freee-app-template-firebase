# freee-app-template-firebase

このアプリは Firebase 上で動作する [freee SDK](https://github.com/freee/firebase-sdk-js) を利用して、 freee アカウントの認証や freee API の呼び出しを行うサンプルアプリです。

このリポジトリをコピー・クローンして、独自の freee アプリ作成時のテンプレートとして利用することもできます。（このリポジトリはMITライセンスです。）

## このアプリでできること

- ログイン（freee アカウントの認証）
    - freee ログイン画面の表示
    - freee アカウントの認証と認可
    - コールバックで freee アカウントの情報を Firebase に保存
    - ログイン後のホーム画面の表示
- ログアウト
- 事業所情報の取得
    - SDK を利用して freee API の GET api/1/users/me を呼び出します
- 取引情報の登録
    - SDK を利用して freee API の POST api/1/deals を呼び出します
- freee API の呼び出しに必要なアクセストークンとリフレッシュトークンの、暗号化と key rotation

## 実行環境

Windows環境はサポートしておりません。

## フォルダ構成

このアプリでは以下の firebase のサービスを利用します。

- 静的ファイルを任意のドメインで配信する [Firebase Hosting](https://firebase.google.com/docs/hosting/?hl=ja)
- freee API を呼び出す [Firebase Cloud Functions](https://firebase.google.com/docs/functions?hl=ja)
- データの保存を行う [Cloud FireStore](https://firebase.google.com/docs/firestore?hl=ja)

Firebase での Web アプリ作成については[公式リファレンス](https://firebase.google.com/docs/web/setup?hl=ja)もご参照ください。 

```
リポジトリのルートディレクトリ
├ functions .. Firebase Cloud Functions にデプロイされるソースのルートディレクトリ
│　└ src .. Firebase Cloud Functions 用の主要なソースを置いているディレクトリ
│　　　├ config .. 各種設定ファイルを置いているディレクトリ
│　　　│　　├ config.xxxx.json .. freee の SDK 用の設定ファイル
│　　　│　　└ service-account.xxxx.json .. Firebase 用の設定ファイル
│　　　├ freee_sdk .. freee の SDK のセットアップファイル置き場
│　　　├ routes .. freee アカウントの認証を制御するファイル置き場
│　　　├ services .. Firebase Cloud Functions に登録する API 用のソース置き場
│　　　└ index.tx .. Firebase Cloud Functions に登録する API 用のエンドポイントを定義するファイル
│
└ hosting .. Firebase Hosting にデプロイされるソースのルートディレクトリ
　　└ src .. Firebase Hosting 用の主要なソースを置いているディレクトリ
　　　　├ services .. Firebase Cloud Functions との接続用のソースを置いているディレクトリ
　　　　├ utils .. アプリを書く上で便利なプログラムを置いているディレクトリ
　　　　├ index.html .. アプリの画面ファイル
　　　　├ main.css .. アプリのCSSファイル
　　　　└ main.ts .. アプリの画面用のソースファイル
```

## 開発環境のセットアップ

### 事前に必要なアプリケーション

- git
- nodenv
- Google Chrome

### Step 1: Firebase プロジェクトと freee アプリの作成

1. リポジトリをクローンする。
   ```
   $ git clone https://github.com/freee/freee-app-template-firebase.git
   $ cd freee-app-template-firebase
   ```
1. firebase-tools をインストールする。
   ```
   npm install -g firebase-tools@7.12.1
   ```
1. firebase にログインする。（ブラウザで認証画面が表示されるので、承認してください。）
   ```
   firebase login
   ```
1. firebase のコンソールで firebase プロジェクトを作成する。（ https://console.firebase.google.com/u/0/?hl=ja を参考にしながら firebase プロジェクトを作成してください。）
1. 作成した firebase プロジェクトの詳細画面を開き、サイドバーから Firestore を選択し Firestore をアクティベートする。（ ロケーションは `asia-northeast1` を選択してください。）
1. 同様にサイドバーから Storage を選択し Storage をアクティベートする。（ ロケーションは `asia-northeast1` を選択してください。）
1. 作成したプロジェクトの [Project ID] を確認する。
   ```
   firebase projects:list

   出力例)
   ┌──────────────────────────────┬───────────────────────────────────┬──────────────────────┐
   │ Project Display Name         │ Project ID                        │ Resource Location ID │
   ├──────────────────────────────┼───────────────────────────────────┼──────────────────────┤
   │ template-firebase-local      │ template-firebase-local           │ asia-northeast1      │
   ├──────────────────────────────┼───────────────────────────────────┼──────────────────────┤
   ```
1. firebase プロジェクトを紐付ける。
   ```
   firebase use [Project ID]

   実行例)
   firebase use template-firebase-local
   ```
1. freee アプリストアで freee アプリを作成する。（ [こちら](https://developer.freee.co.jp/tutorials/starting-api)を参考にしながら freee アプリを作成してください。）
    - コールバック URL は `http://localhost:5001/{{project-id}}/us-central1/api/auth/callback` にしてください。

### Step 2: Firebase Cloud Functions の設定

Firebase Cloud Functions はサーバーレスで実行できる関数で、ローカルで動かすこともできます。

ここでは、ローカルで Firebase Cloud Functions を動作させる手順を紹介します。

1. `functions/.runtimeconfig.json` を設定する。
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
   ※ runtimeconfig は Cloud Functions をローカルで動作させる場合のみ function に反映されます。 Firebase 上で動作させる場合は[こちら](https://firebase.google.com/docs/functions/config-env#set_environment_configuration_for_your_project)を参考に、環境変数を設定してください。
1. Firebase 用の設定ファイルを準備する。[こちら](https://firebase.google.com/docs/auth/web/custom-auth?hl=ja) を参考に JSON file をダウンロードし、 `functions/src/config/service-account.local.json` というファイル名で保存してください。
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
1. freee SDK 用の設定ファイルを準備する。 `functions/src/config/config.local.json` に以下のファイルを準備してください。
   ```
   {
     "freee": {
       "authHost": "http://localhost:5001/{{project-id}}/us-central1/api/auth",
       "appHost": "http://localhost:5000",
       "homePath": "/select_company",
       "tokenHost": "https://accounts.secure.freee.co.jp",
       "apiHost": "https://api.freee.co.jp"
     },
     "firebase": {
       "apiKey": "{{project-api-key}}",
       "cryptoKeyBucket": "{{project-id}}.appspot.com"
     }
   }
   ```

### Step 3: Firebase Hosting の設定

Firebase Hosting は静的なファイル（HTML, JavaScript等）をデプロイして任意のドメインで公開できるホスティングサービスです。

このアプリでは Firebase Hosting から Firebase Cloud Functions を呼び出して、アプリを動作させています。

1. `.env` を設定する。
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

### Step 4: アプリの起動

1. `npm run setup` を実行する。
1. `npm start` を実行し、`http://localhost:5000` （hosting のURL）にアクセスする。

## 本番環境のセットアップ

### Step 1: Firebase プロジェクトの作成

1. 本番環境用に改めて Firebase プロジェクトと freee アプリを作成してください。（開発環境のセットアップのStep 1を参考にしてください。）
    - freee アプリのコールバック URL には、以下を設定してください。
        - `https://asia-northeast1-[Project ID].cloudfunctions.net/api/auth/callback`
1. コマンドラインから本番環境用に作成したプロジェクトの利用するように切り替えます。
   ```
   firebase use [Project ID]
   ```

### Step 2: Firebase Cloud Functions の設定

開発環境用に設定した各種設定ファイルについても、 本番環境用のファイルを作成する必要があります。

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
    "cryptoKeyBucket": "{{project-id}}.appspot.com"
  }
}
```

また本番環境で Firebase Cloud Functions を動作させるためには、`.runtimeconfig.json` の内容を Firebase Cloud Functions に設定する必要があります。[こちら](https://firebase.google.com/docs/functions/config-env#set_environment_configuration_for_your_project)を参考に Firebase Cloud Functions の環境変数設定を行ってください。

以下を参考にコマンドラインから設定してください。

```
$ firebase functions:config:set env.mode=production env.region="asia-northeast1" freee.client_id=xxx freee.client_secret=xxx env.serviceaccountpath="config/service-account.production.json"
```

### Step 3: デプロイの実行

`npm run deploy` を実行してください。

## FAQ

Q. Firebase の料金プランはどうしたら良いか？

A. Blaze プランにする必要があります。freee の API は外部の API にあたり、functions 上からの接続には Blaze プランにする必要があります。
