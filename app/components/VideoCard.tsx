"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { Category, Person, Video } from "@/app/lib/archive-types";

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

const PERSON_ORDER = [
  "잠뜰",
  "라더",
  "덕개",
  "각별",
  "공룡",
  "수현",
  "올멤",
  "요정",
  "태쁘",
  "팀샐",
  "게스트",
];

const sortPeople = <T extends { name: string }>(items: T[]) =>
  [...items].sort((a, b) => {
    const ai = PERSON_ORDER.indexOf(a.name);
    const bi = PERSON_ORDER.indexOf(b.name);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.name.localeCompare(b.name, "ko");
  });

const GENRE_ORDER = [
  "마인크래프트",
  "종합게임",
  "스토리 / 역할극",
  "공포 / 스릴",
  "예능 / 개그",
  "감동 / 드라마",
  "추리",
  "상황극",
  "미니게임",
  "마피아 / 머더 / 라이어게임",
  "베드워즈 / 스카이블록",
  "생존 / 야생 / 엔드런",
  "PVP / 전투 / 레이드",
  "탈출 / 추격",
  "파쿠르 / 데스런",
  "숨바꼭질 / 꼬리잡기 / 도능",
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
  const selectedPeople = sortPeople(
    people.filter((person) => (video.peopleIds ?? []).includes(person.id))
  );

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

  const allTags = [
    ...selectedGenres.map((genre) => ({
      id: `genre-${genre.id}`,
      name: genre.name,
      className: "rounded-full border border-purple-400/20 bg-purple-400/10 px-2.5 py-1 text-[11px] font-medium text-purple-300",
    })),
    ...selectedTypes.map((type) => ({
      id: `type-${type.id}`,
      name: type.name,
      className: "rounded-full border border-indigo-400/20 bg-indigo-400/10 px-2.5 py-1 text-[11px] font-medium text-indigo-300",
    })),
    ...(videoSeries
      ? [{
          id: `series-${videoSeries.id}`,
          name: videoSeries.name,
          className: "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300",
        }]
      : []),
    ...selectedPeople.map((person) => ({
      id: `person-${person.id}`,
      name: person.name,
      className: `rounded-full border px-2.5 py-1 text-[11px] font-medium ${personColors[person.name] ?? "border-zinc-700 bg-zinc-800 text-zinc-400"}`,
    })),
    ...(relatedCount > 0
      ? [{
          id: "related",
          name: `연계 ${relatedCount}`,
          className: "rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[11px] font-medium text-sky-300",
        }]
      : []),
  ];

  const [showAllTags, setShowAllTags] = useState(false);
  const [visibleTagCount, setVisibleTagCount] = useState(allTags.length);
  const tagMeasureRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = tagMeasureRef.current;
    if (!container) return;

    const measure = () => {
      const tagElements = Array.from(
        container.querySelectorAll<HTMLElement>("[data-tag-index]")
      );
      const moreButton = container.querySelector<HTMLElement>("[data-more-button]");

      if (!tagElements.length) {
        setVisibleTagCount(0);
        return;
      }

      const lineHeight = 24;
      const fitsTwoLines = (count: number) => {
        const elements = tagElements.slice(0, count);
        elements.forEach((element) => {
          element.style.display = "inline-flex";
        });
        tagElements.slice(count).forEach((element) => {
          element.style.display = "none";
        });

        if (moreButton) {
          moreButton.style.display = count < allTags.length ? "inline-flex" : "none";
        }

        const tops = elements
          .filter((element) => element.offsetParent !== null)
          .map((element) => element.offsetTop);
        const moreTop = moreButton && moreButton.offsetParent !== null
          ? moreButton.offsetTop
          : null;
        const allTops = moreTop === null ? tops : [...tops, moreTop];
        const rows = new Set(allTops);

        return rows.size <= 2;
      };

      let best = allTags.length;
      if (!fitsTwoLines(best)) {
        best = 0;
        for (let count = 1; count <= allTags.length; count += 1) {
          if (fitsTwoLines(count)) best = count;
          else break;
        }
      }

      setVisibleTagCount(best);

      tagElements.forEach((element, index) => {
        element.style.display = index < best ? "inline-flex" : "none";
      });
      if (moreButton) {
        moreButton.style.display = best < allTags.length ? "inline-flex" : "none";
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [allTags.length]);

  const hiddenTagCount = Math.max(0, allTags.length - visibleTagCount);

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

        <div className="relative mt-4 h-20 shrink-0 overflow-hidden">
          <div ref={tagMeasureRef} className="flex h-full content-start flex-wrap gap-1.5 overflow-hidden">
            {allTags.map((tag, index) => (
              <span
                key={tag.id}
                data-tag-index={index}
                className={`${tag.className} max-w-full whitespace-nowrap`}
                title={tag.name}
              >
                {tag.name}
              </span>
            ))}

            <button
  type="button"
  data-more-button
  onClick={() => setShowAllTags(true)}
  className="hidden shrink-0 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-700 hover:text-white"
  aria-label={`태그 ${hiddenTagCount}개 더 보기`}
>
  <span className="inline-flex h-full items-center justify-center text-[15px] leading-4">
    +{hiddenTagCount}
  </span>
</button>
          </div>
        </div>

        {showAllTags && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowAllTags(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="전체 태그"
            >
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-zinc-100">전체 태그</h4>
                <button
                  type="button"
                  onClick={() => setShowAllTags(false)}
                  className="rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  닫기
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <span key={tag.id} className={tag.className}>
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

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
