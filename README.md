# Resonant Inscapes (MVP)

Prompt List共有プラットフォームです。  
音楽のVA値 (Valence / Arousal) に対応した画像生成向け `tags / negativeTags / prompt` を作成・共有・ダウンロードできます。
VA空間は 10×10 のグリッドで管理し、Prompt Listは基本的に 100 points で構成されます。

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase (`@supabase/supabase-js`)
- OpenAI API (作成時のみ使用)

## Setup

1. 依存関係インストール

```bash
npm install
```

2. 環境変数を設定 (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# 任意。API Route でRLSを回避するサーバー専用キー
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
# 任意。未設定時は gpt-4o-mini
OPENAI_MODEL=
```

- `OPENAI_API_KEY` はサーバー専用です (`NEXT_PUBLIC_` を付けない)。
- `OPENAI_MODEL` で Chat Completions のモデルを上書きできます（例: `gpt-4o`）。
- 未設定時は `/create` の生成で mock fallback が動作します。

3. Supabase スキーマを実行

- `supabase/schema.sql` を Supabase SQL Editor で実行してください。
- `supabase/auth-profiles.sql` を実行すると、`auth.users` 作成時に `profiles` が自動作成されます（既存ユーザーのbackfill付き）。
- さらに `supabase/rls-mvp.sql` を実行すると、MVP向けのRLSポリシーが有効になります。

4. 開発サーバー起動

```bash
npm run dev
```

## Supabase Notes

- `lib/supabase/client.ts`: ブラウザ向け client
- `lib/promptLists.ts`: Prompt Listの取得・保存・download_count更新
- 現在は Supabase 取得失敗時に mock fallback を使用します
- 将来的に Auth / Storage を追加予定です

### Future Storage Buckets

- `prompt-list-thumbnails`
- `prompt-list-samples`
- `prompt-list-audio`

## OpenAI Generation

- API Route: `POST /api/generate-prompt-list`
- 役割: `/create` から4象限入力を受け取り、10x10 (100 points) のPrompt ListをJSONで生成
- 4つのサンプル音源は、VA空間4象限の「核」を作るために使います
- ChatGPT APIは、その核から周辺VA地点のプロンプトを予測・補間するために使います
- 失敗時: `OpenAI generation failed. Using mock data.` を返してmock生成にフォールバック
- 設計方針: LLMは作成時のみ使用し、リアルタイム再生時には保存済み100-point Prompt Listのみ参照します

## Sample Audio Placement

4象限サンプル音声は以下に配置します。

- `public/audio/samples/sample_hv_ha.mp3` (Joyful / Energetic)
- `public/audio/samples/sample_hv_la.mp3` (Peaceful / Warm)
- `public/audio/samples/sample_lv_ha.mp3` (Tense / Intense)
- `public/audio/samples/sample_lv_la.mp3` (Lonely / Quiet)

注意:

- 現時点では音声ファイル本体は未配置でOKです
- 後から同名ファイルを `public/audio/samples/` に置けば `/create` のaudio playerで再生できます
