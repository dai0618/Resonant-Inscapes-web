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
- 役割: `/create` から4象限入力を受け取り、10×10（100点）の Prompt List を JSON で返す
- **100点は単純な四隅の双一次補間だけではない**: mood / color / lighting / texture は VA 上で四隅から重み付きブレンドしつつ、**scene / place / subject / composition** は象限ごとの `sceneFamilies` から決定的（seeded）に分散させ、同じ風景語の連発を避ける
- **LLM あり**: ① 小さな JSON で四隅を英語化（`sceneFamilies`, `colorPalette`, `lightingTags`, `textureTags` を含む）② 4ブロック×25点並列で各セルの `prompt` / `sceneFamily` 等を生成。失敗時は `generationMode: "diverse_interpolate"` でローカル多様化グリッドに切り替え
- **API キーなし**: ローカル四隅シード + 既定 `sceneFamilies` とユーザー `place` 等から **`diverse_interpolate`** 相当の 100 点を生成（`lib/diverseGridGeneration.ts`）
- 4つのサンプル音源は、VA 四象限の「核」を作るための参考としてフォームに使います
- 失敗時（例外）: mock 相当のフォールバック応答（多様化グリッドを含む）
- 設計方針: LLM は作成時のみ。再生時は保存済み 100 点のみ参照

## Sample Audio Placement

4象限サンプル音声は以下に配置します。

- `public/audio/samples/sample_hv_ha.mp3` (Joyful / Energetic)
- `public/audio/samples/sample_hv_la.mp3` (Peaceful / Warm)
- `public/audio/samples/sample_lv_ha.mp3` (Tense / Intense)
- `public/audio/samples/sample_lv_la.mp3` (Lonely / Quiet)

注意:

- 現時点では音声ファイル本体は未配置でOKです
- 後から同名ファイルを `public/audio/samples/` に置けば `/create` のaudio playerで再生できます
