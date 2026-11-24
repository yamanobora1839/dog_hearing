# dog_hearing

スマートフォン向けの、犬の聴覚を体験できるオフラインWebアプリです。

## 特徴

- HTML / CSS / JavaScriptのみで構成
- Web Audio APIの `OscillatorNode` を使ってブラウザ内で正弦波を生成
- 周波数を500Hz～18,000Hzの範囲で100Hz単位に調整
- 再生中もスライダー操作で周波数を連続変更
- ページを離れる・バックグラウンドになる・ウィンドウがフォーカスを失うと停止
- 外部ライブラリ、サーバー、API、音声ファイルを使用しない

## ローカルでの確認

静的なWebサーバーを起動するか、ファイルをブラウザで開いて利用できます。
ローカルサーバーの例：

```bash
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開きます。

## GitHub Pagesで公開

1. リポジトリの `Settings` を開く
2. 左メニューの `Pages` を開く
3. `Build and deployment` の `Source` を `Deploy from a branch` に設定
4. ブランチを `main`、フォルダーを `/ (root)` に設定
5. `Save` を押す

公開URLはリポジトリ名に応じたGitHub PagesのURLになります。

## 注意

スマートフォンのスピーカーには機種ごとの再生限界があります。
生成した周波数が、必ずしも十分な音量で実際に聞こえるとは限りません。
