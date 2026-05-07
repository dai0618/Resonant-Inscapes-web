type SampleMusicCardProps = {
  title: string;
  subtitle: string;
  src: string;
};

export default function SampleMusicCard({ title, subtitle, src }: SampleMusicCardProps) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h4 className="mb-1 text-sm font-semibold text-zinc-950">{title}</h4>
      <p className="mb-2 text-sm text-zinc-800">{subtitle}</p>
      <audio controls src={src} className="w-full" />
      <p className="mt-2 text-xs text-zinc-800">音声ファイルは public/audio/samples/ に配置すると再生できます。</p>
    </article>
  );
}
