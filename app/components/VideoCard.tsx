"use client";

import type { Category, Person, Video } from "@/lib/archive-types";

type VideoCardProps = {
  video: Video;
  people: Person[];
  genres: Category[];
  types: Category[];
  series: Category[];
  relatedCount?: number;
  onEdit: (video: Video) => void;
};

const personColors: Record<string, string> = {
  잠뜰: "bg-sky-400/15 text-sky-300 border-sky-400/25",
  하늘: "bg-cyan-400/15 text-cyan-300 border-cyan-400/25",
  각별: "bg-yellow-400/15 text-yellow-300 border-yellow-400/25",
  공룡: "bg-green-400/15 text-green-300 border-green-400/25",
  수현: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  라더: "bg-red-400/15 text-red-300 border-red-400/25",
  덕개: "bg-orange-400/15 text-orange-300 border-orange-400/25",
  요정: "bg-pink-400/15 text-pink-300 border-pink-400/25",
  올멤: "bg-zinc-500/20 text-zinc-300 border-zinc-500/25",
  태쁘: "bg-blue-700/20 text-blue-300 border-blue-700/30",
  팀샐: "bg-lime-400/15 text-lime-300 border-lime-400/25",
};

const GENRE_ORDER = [
  "마인크래프트",
  "종합게임",
  "스토리",
  "추리",
  "상황극",
  "공포 / 스릴",
  "예능 / 개그",
  "감동 / 드라마",
  "미니게임",
  "PVP / 전투",
  "생존 / 야생 / 엔드런",
  "마피아 / 머더 / 라이어게임",
  "술래잡기 / 숨바꼭질 / 꼬리잡기",
  "탈출 / 추격",
  "데스런 / 파쿠르",
  "기지전쟁 / 베드워즈 / 스카이블록",
  "모드 / 업데이트",
  "크로스오버",
  "실사",
  "토크",
];

const sortGenres = <T extends { name: string }>(items: T[]) =>
  [...items].sort((a, b) => {
    const ai = GENRE_ORDER.indexOf(a.name);
    const bi = GENRE_ORDER.indexOf(b.name);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.name.localeCompare(b.name, "ko");
  });

export default function VideoCard({
  video,
  people,
  genres,
  types,
  series,
  relatedCount = 0,
  onEdit,
}: VideoCardProps) {
  const selectedGenres = sortGenres(
    genres.filter((genre) =>
      (video.genreIds ?? []).includes(genre.id)
    )
  );

  const selectedTypes = types.filter((type) => {
    const typeIds = Array.isArray(video.typeIds)
      ? video.typeIds
      : video.typeId != null
        ? [video.typeId]
        : [];

    return typeIds.includes(type.id);
  });

  const videoSeries = series.find(
    (item) => item.id === video.seriesId
  );

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/70 shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-900">
      <a
        href={video.youtube_url}
        target="_blank"
        rel="noreferrer"
        className="block"
      >
        <div className="relative aspect-video overflow-hidden bg-zinc-800">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur">
            YouTube
          </div>
        </div>
      </a>

      <div className="flex flex-1 flex-col p-5">
        <a
          href={video.youtube_url}
          target="_blank"
          rel="noreferrer"
        >
          <h3 className="line-clamp-2 min-h-12 text-[15px] font-semibold leading-6 text-zinc-100 transition group-hover:text-white">
            {video.title}
          </h3>
        </a>

        <p className="mt-2 text-xs text-zinc-500">
          {video.published_at.slice(0, 10)}
        </p>

        <div className="mt-4 flex h-20 shrink-0 content-start flex-wrap gap-1.5 overflow-hidden">
          {selectedGenres.map((genre) => (
            <span
              key={`genre-${genre.id}`}
              className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2.5 py-1 text-[11px] font-medium text-purple-300"
            >
              {genre.name}
            </span>
          ))}

          {selectedTypes.map((type) => (
            <span
              key={`type-${type.id}`}
              className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-2.5 py-1 text-[11px] font-medium text-indigo-300"
            >
              {type.name}
            </span>
          ))}

          {videoSeries && (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
              {videoSeries.name}
            </span>
          )}

          {(video.peopleIds ?? []).map((personId) => {
            const person = people.find(
              (item) => item.id === personId
            );

            if (!person) return null;

            const colorClass =
              personColors[person.name] ??
              "border-zinc-700 bg-zinc-800 text-zinc-400";

            return (
              <span
                key={`person-${personId}`}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${colorClass}`}
              >
                {person.name}
              </span>
            );
          })}

          {relatedCount > 0 && (
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[11px] font-medium text-sky-300">
              연계 {relatedCount}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onEdit(video)}
          className="mt-auto flex w-full items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800/70 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-700 hover:text-white"
        >
          영상 관리
        </button>
      </div>
    </article>
  );
}
