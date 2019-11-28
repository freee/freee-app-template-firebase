# freee-app-template-firebase

このアプリは firebase 上で動作する [freee SDK](https://github.com/freee/firebase-sdk-js) を利用して、
認証や API コールを行うサンプルコードを実装したものです。

## 実装内容

- freee ログイン画面へリダイレクト -> 認可 -> コールバックで user 情報を firebase に保存 -> ホーム画面へ遷移
- ログアウト
- 会社情報の読み込み (GET api/1/users/me)
- 取引情報の登録 (POST api/1/deals)
- アクセストークン、リフレッシュトークンの暗号化

## セットアップ

1 git clone https://github.com/freee/freee-app-template-firebase.git

2 firebase-tools をインストール  
`npm install -g firebase-tools`

3 firebase にログイン  
`firebase login`  
認証画面に遷移するので承認してください。

4 firebase のコンソールでアプリを作成
https://console.firebase.google.com/u/0/?hl=ja

Firestore、Storage はアクティベーションをしておかないとエラーとなるため、設定を行う。
ロケーションは基本は`asia-northeast1`で統一する(Firestore は後から変更できないので注意)

5 firebase プロジェクトを紐付け  
`firebase init` を行い、案内にしたがって設定を行う
　 5-1 どの機能を利用するか聞かれるので、`Firestore, Functions, Hosting, Storage`を選択  
　 5.2 firebase プロジェクトを新規作成するか、作成したものを選択するか聞かれるので、先ほど作成したプロジェクトを選択  
　 5.3 functions の言語を聞かれるので、typescript を選択  
　 5.4 tslint を適用するか聞かれるので、yes を選択  
　 5.5 npm install を今行うか聞かれるので、no を選択  
　 5.6 その他上書きが発生する場合は、全て no を選択

6 freee アプリストアでアプリを作成する  
`https://app.secure.freee.co.jp/developers/demo_companies/description`  
こちらを参考にしながらアプリを作成する。  
コールバック URL は `http://localhost:5001/作成したfirebaseプロジェクト名/asia-northeast1/api/auth/callback` で設定する。

7 `functions/.runtimeconfig.json` を準備する  
以下のように設定する。
`env.mode`は`functions/src/config/config.xxx.json`の環境ごとの読み分けに利用する変数。

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

8 サービスアカウント認証用ファイルを準備する
https://firebase.google.com/docs/auth/web/custom-auth?hl=ja を参考に json file をダウンロードし、 `functions/src/config/service-account.local.json` というファイルで保存する。

9 `npm run setup` を実行する

10 `npm start` を実行し、`http://localhost:5000` にアクセスする

## デプロイ

`npm run deploy` を実行してください。その際には、`.runtimeconfig.json` の内容を functions に設定する必要があります。以下のリンクを参考に設定を行ってください。
`https://firebase.google.com/docs/functions/config-env#set_environment_configuration_for_your_project`

## フォルダ構成

```
Root
│
├ hosting .. firebase hosting にデプロイされるソースのルートフォルダ
├ functions .. firebase functions にデプロイされるソースのルートフォルダ
　　 ├ config .. 各種 configuration
　　 ├ config.xxxx.json .. SDKConfig 用の設定情報
　　 ├ service-account.json .. Service Account credential file for firebase
```

## FAQ

Q. firebase の料金プランはどうしたら良いか？  
A. Blaze プランにする必要があります。freee の API は外部の API にあたり、functions 上からの接続には Blaze プランにする必要があります。

Q. 動作確認でエラーが出る  
A. 各種 config ファイルや、firebase のセットアップが完了しているか、リージョンが正しいかなどご確認ください。

Q. 本番やデプロイ環境のの各種環境設定ファイルのサンプルが欲しい。  
A. 以下を参考にしてください。対象ファイルを読み込む対応は別途行ってください。

- `firebase functions:config:get` (`region`は未設定でも`asia-northeast1`に設定されます。また`mode`を`production`に設定することによって SDKConfig の default 値が自動的に設定されます)

```
{
  "env": {
    "mode": "production",
    "region": "asia-northeast1"
  },
  "freee": {
    "client_id": "xxxxxxxxxxxxxxx",
    "client_secret":"xxxxxxxxxxxxxx"
  }
}
```

- `hosting/.env.production` (`production`は環境ごとに変わる。アプリ特有の変数を設定しない限り設定不要)

```
# functionsのURL
CLOUD_FUNCTION_HOST=https://asia-northeast1-foreign-exchange-app.cloudfunctions.net
```

- `functions/config.production.json` (`production`は環境ごとに変わる。カスタムドメインや複数 bucket などアプリ特有の変数を設定しない限り設定不要)

```
{
    "freee": {
        "authHost": "https://asia-northeast1-freee-sample-app.cloudfunctions.net/api/auth",
        "appHost": "https://freee-sample.freee-apps.jp",
        "homePath": "/home",
        "tokenHost": "https://accounts.secure.freee.co.jp",
        "apiHost": "https://api.freee.co.jp"
    },
    "firebase": {
        "cryptoKeyBucket": "freee-sample-app.appspot.com"
    }
}
```
