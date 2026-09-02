"use client";

import {
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import type { Category, Person, Video } from "../lib/archive-types";

type VideoEditorProps = {
  video: Video | null;
  videos: Video[];

  people: Person[];
  genres: Category[];
  types: Category[];
  series: Category[];

  selectedPeople: number[];
  selectedGenres: number[];

  selectedTypes: number[];
  selectedSeries: number | null;
  selectedRelatedVideos: number[];

  saving: boolean;

  setSelectedPeople: React.Dispatch<
    React.SetStateAction<number[]>
  >;

  setSelectedGenres: React.Dispatch<
    React.SetStateAction<number[]>
  >;

  setSelectedTypes: React.Dispatch<
    React.SetStateAction<number[]>
  >;

  setSelectedSeries: React.Dispatch<
    React.SetStateAction<number | null>
  >;

  setSelectedRelatedVideos: React.Dispatch<
    React.SetStateAction<number[]>
  >;

  onSave: () => void;
  onClose: () => void;
  onNavigateToVideo: (videoId: number) => void;
};

const personColors: Record<string, string> = {
  잠뜰: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  하늘: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  각별: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
  공룡: "border-green-400/30 bg-green-400/10 text-green-300",
  수현: "border-purple-400/30 bg-purple-400/10 text-purple-300",
  라더: "border-red-400/30 bg-red-400/10 text-red-300",
  덕개: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  요정: "border-pink-400/30 bg-pink-400/10 text-pink-300",
  올멤: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
  태쁘: "border-blue-700/40 bg-blue-700/15 text-blue-300",
  팀샐: "border-lime-400/30 bg-lime-400/10 text-lime-300",
};

const genreColor =
  "border-purple-400/40 bg-purple-400/15 text-purple-300";

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
  "술래잡기 / 숨바꼭질 / 꼬리잡기 / 도능",
  "베드워즈 / 스카이블록 / 기지전쟁",
  "생존 / 야생 / 엔드런",
  "PVP / 전투 / 레이드",
  "탈출 / 추격",
  "파쿠르 / 데스런",
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

const PERSON_ORDER = [
  "라더",
  "덕개",
  "각별",
  "공룡",
  "잠뜰",
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

type Menu = "people" | "genres" | "type" | "series" | "related";

export default function VideoEditor({
  video,
  people,
  genres,
  types,
  series,
  videos,
  selectedPeople,
  selectedGenres,
  selectedTypes,
  selectedSeries,
  selectedRelatedVideos,
  saving,
  setSelectedPeople,
  setSelectedGenres,
  setSelectedTypes,
  setSelectedSeries,
  setSelectedRelatedVideos,
  onSave,
  onClose,
  onNavigateToVideo,
}: VideoEditorProps) {
  const safeSelectedPeople = selectedPeople ?? [];
  const safeSelectedGenres = selectedGenres ?? [];
  const safeSelectedTypes = selectedTypes ?? [];
  const safeSelectedSeries = selectedSeries ?? null;
  const safeSelectedRelatedVideos =
    selectedRelatedVideos ?? [];

  const [activeMenu, setActiveMenu] =
    useState<Menu>("people");

  const [seriesSearch, setSeriesSearch] = useState("");
  const [relatedSearch, setRelatedSearch] = useState("");
  const [relatedLoading, setRelatedLoading] = useState(false);

  /*
   * 다른 영상을 열 때마다
   * 항상 멤버 메뉴부터 표시
   */
  useEffect(() => {
    if (video) {
      setActiveMenu("people");
      setSeriesSearch("");
      setRelatedSearch("");
    }
  }, [video]);

  if (!video) return null;

  const togglePerson = (id: number) => {
    setSelectedPeople((prev) =>
      prev.includes(id)
        ? prev.filter(
            (item) => item !== id
          )
        : [...prev, id]
    );
  };

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id)
        ? prev.filter(
            (item) => item !== id
          )
        : [...prev, id]
    );
  };

  const toggleType = (id: number) => {
    setSelectedTypes((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const toggleRelatedVideo = (id: number) => {
    setSelectedRelatedVideos((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const menuClass = (menu: Menu) =>
    `flex min-h-9 w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[11px] font-medium transition ${
      activeMenu === menu
        ? "bg-zinc-800 text-zinc-100"
        : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5">
      <div className="flex h-[min(680px,90vh)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">

        {/* 헤더 */}
        <header className="shrink-0 border-b border-zinc-800/80 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                Video Manager
              </p>

              <h2 className="mt-1 text-lg font-bold text-zinc-100">
                영상 관리
              </h2>

              <p className="mt-1 truncate text-xs text-zinc-500">
                {video.title}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-lg text-zinc-500 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </header>

        {/* 현재 선택된 태그 */}
        <section className="shrink-0 border-b border-zinc-800/80 bg-zinc-950 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-start gap-3">
            <p className="shrink-0 pt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              현재 선택
            </p>

            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {safeSelectedPeople.map((id) => {
                const person = people.find((item) => item.id === id);
                if (!person) return null;

                return (
                  <span
                    key={`selected-person-${id}`}
                    className={`rounded-full border px-2.5 py-1 text-[11px] ${
                      personColors[person.name] ??
                      "border-zinc-700 bg-zinc-900 text-zinc-400"
                    }`}
                  >
                    {person.name}
                  </span>
                );
              })}

              {sortGenres(
                genres.filter((item) =>
                  safeSelectedGenres.includes(item.id)
                )
              ).map((genre) => (
                <span
                  key={`selected-genre-${genre.id}`}
                  className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2.5 py-1 text-[11px] text-purple-300"
                >
                  {genre.name}
                </span>
              ))}

              {safeSelectedTypes.map((id) => {
                const type = types.find((item) => item.id === id);
                if (!type) return null;

                return (
                  <span
                    key={`selected-type-${id}`}
                    className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-2.5 py-1 text-[11px] text-indigo-300"
                  >
                    {type.name}
                  </span>
                );
              })}

              {safeSelectedSeries !== null && (
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-300">
                  {series.find((item) => item.id === safeSelectedSeries)?.name ??
                    "시리즈"}
                </span>
              )}

              {safeSelectedRelatedVideos.length > 0 && (
                <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[11px] text-sky-300">
                  연계 {safeSelectedRelatedVideos.length}
                </span>
              )}

              {safeSelectedPeople.length === 0 &&
                safeSelectedGenres.length === 0 &&
                safeSelectedTypes.length === 0 &&
                safeSelectedSeries === null &&
                safeSelectedRelatedVideos.length === 0 && (
                  <span className="text-xs text-zinc-700">
                    선택된 태그가 없습니다.
                  </span>
                )}
            </div>
          </div>
        </section>

        {/* 본문 */}
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">

          {/* 메뉴 */}
          <aside className="shrink-0 border-b border-zinc-800/80 bg-zinc-950 p-1 sm:w-[100px] sm:border-b-0 sm:border-r sm:p-2.5">
            <p className="mb-1 px-1 text-[7px] font-semibold uppercase tracking-wider text-zinc-700">
              Settings
            </p>

            <div className="grid grid-cols-5 gap-1 sm:block sm:space-y-0.5">
            <button
              type="button"
              onClick={() =>
                setActiveMenu("people")
              }
              className={`${menuClass("people")} min-w-0 w-full justify-center whitespace-nowrap px-1 py-2 text-[9px] sm:justify-between sm:px-1.5 sm:py-2 sm:text-[10px]`}
            >
              <span>멤버</span>
              <span className="w-4 shrink-0 text-center text-[10px] leading-none text-zinc-600">
                {safeSelectedPeople.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveMenu("genres")
              }
              className={`${menuClass("genres")} min-w-0 w-full justify-center whitespace-nowrap px-1 py-2 text-[9px] sm:justify-between sm:px-1.5 sm:py-2 sm:text-[10px]`}
            >
              <span>장르</span>
              <span className="w-4 shrink-0 text-center text-[10px] leading-none text-zinc-600">
                {safeSelectedGenres.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveMenu("type")
              }
              className={`${menuClass("type")} min-w-0 w-full justify-center whitespace-nowrap px-1 py-2 text-[9px] sm:justify-between sm:px-1.5 sm:py-2 sm:text-[10px]`}
            >
              <span>타입</span>

              <span className="w-4 shrink-0 text-center text-[10px] leading-none text-zinc-600">
                {safeSelectedTypes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveMenu("series")
              }
              className={`${menuClass("series")} min-w-0 w-full justify-center whitespace-nowrap px-1 py-2 text-[9px] sm:justify-between sm:px-1.5 sm:py-2 sm:text-[10px]`}
            >
              <span>시리즈</span>

              <span className="flex h-4 w-3.5 shrink-0 items-center justify-center text-center text-[10px] leading-none text-zinc-600">
                {safeSelectedSeries !== null ? "✓" : "○"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu("related")}
              className={`${menuClass("related")} min-w-0 w-full justify-center whitespace-nowrap px-1 py-2 text-[9px] sm:justify-between sm:px-1.5 sm:py-2 sm:text-[10px]`}
            >
              <span>연계</span>
              <span className="w-4 shrink-0 text-center text-[10px] leading-none text-zinc-600">
                {safeSelectedRelatedVideos.length}
              </span>
            </button>
            </div>
          </aside>

          {/* 설정 영역 */}
          <main data-video-editor-content className="min-h-0 min-w-0 flex-1 overflow-y-auto p-3 sm:p-4">

            {/* 멤버 */}
            {activeMenu === "people" && (
              <section>
                <div className="mb-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-zinc-100">
                      멤버
                    </h3>

                    <button
                      type="button"
                      onClick={() => setSelectedPeople([])}
                      disabled={saving || safeSelectedPeople.length === 0}
                      className="text-[10px] text-zinc-600 transition hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      초기화
                    </button>
                  </div>

                </div>

                <div className="flex flex-wrap content-start justify-start gap-2">
                  {sortPeople(people).map((person) => {
                    const selected =
                      safeSelectedPeople.includes(person.id);

                    const color =
                      personColors[person.name] ??
                      "border-zinc-700 bg-zinc-900 text-zinc-400";

                    return (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => togglePerson(person.id)}
                        className={`flex min-w-[84px] w-fit shrink-0 grow-0 items-center self-start rounded-lg border px-3 py-2 text-[11px] font-medium leading-4 whitespace-nowrap transition ${
                          selected
                            ? color
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <span className="mr-1.5 flex w-3.5 shrink-0 items-center justify-center text-center">
                          {selected ? "✓" : "○"}
                        </span>
                        <span className="shrink-0">{person.name}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 장르 */}
            {activeMenu === "genres" && (
              <section>
                <div className="mb-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-zinc-100">
                      장르
                    </h3>

                    <button
                      type="button"
                      onClick={() => setSelectedGenres([])}
                      disabled={saving || safeSelectedGenres.length === 0}
                      className="text-[10px] text-zinc-600 transition hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      초기화
                    </button>
                  </div>

                </div>

                <div className="flex flex-wrap content-start justify-start gap-2">
                  {sortGenres(genres).map((genre) => {
                      const selected =
                        safeSelectedGenres.includes(
                          genre.id
                        );

                      const color = genreColor;

                      return (
                        <button
                          key={genre.id}
                          type="button"
                          onClick={() =>
                            toggleGenre(
                              genre.id
                            )
                          }
                          className={`flex w-fit shrink-0 grow-0 items-center self-start rounded-lg border px-3 py-2 text-left text-[11px] font-medium leading-4 whitespace-nowrap transition ${
                            selected
                              ? color
                              : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                          }`}
                        >
                          <span className="mr-1.5">
                            {selected
                              ? "✓"
                              : "○"}
                          </span>

                          {[
                            "생존 / 야생 / 엔드런",
                            "마피아 / 머더 / 라이어게임",
                            "술래잡기 / 숨바꼭질 / 꼬리잡기",
                            "기지전쟁 / 베드워즈 / 스카이블록",
                          ].includes(genre.name) ? (
                            <span className="sm:whitespace-nowrap">
                              {genre.name.split(" / ").map((part, i, arr) => (
                                <span key={part}>
                                  {i > 0 && " / "}
                                  {part}
                                  {i < arr.length - 1 && (
                                    <wbr className="sm:hidden" />
                                  )}
                                </span>
                              ))}
                            </span>
                          ) : (
                            genre.name
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </section>
            )}

            {/* 타입 */}
            {activeMenu === "type" && (
              <section>
                <div className="mb-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-zinc-100">
                      타입
                    </h3>

                    <button
                      type="button"
                      onClick={() => setSelectedTypes([])}
                      disabled={saving || safeSelectedTypes.length === 0}
                      className="text-[10px] text-zinc-600 transition hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      초기화
                    </button>
                  </div>

                </div>

                <div className="flex flex-wrap content-start justify-start gap-2">
                  {types.map((type) => {
                    const selected = safeSelectedTypes.includes(type.id);

                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => toggleType(type.id)}
                        className={`flex min-w-[84px] shrink-0 grow-0 items-center self-start rounded-lg border px-3 py-2 text-left text-[11px] font-medium leading-4 whitespace-nowrap ${
                          selected
                            ? "border-indigo-400/40 bg-indigo-400/15 text-indigo-300"
                            : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <span className="mr-1.5 flex h-4 w-3.5 shrink-0 items-center justify-center text-center">
                          {selected ? "✓" : "○"}
                        </span>
                        <span className="shrink-0">{type.name}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 시리즈 */}
            {activeMenu === "series" && (
              <section className="m-0 block">
                <div className="mb-5 mt-0">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-zinc-100">
                      시리즈
                    </h3>

                    <button
                      type="button"
                      onClick={() => setSelectedSeries(null)}
                      disabled={saving || safeSelectedSeries === null}
                      className="text-[10px] text-zinc-600 transition hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      초기화
                    </button>
                  </div>

                </div>

                <div className="relative mb-3">
                  <input
                    type="text"
                    value={seriesSearch}
                    onChange={(e) => setSeriesSearch(e.target.value)}
                    placeholder="시리즈 이름 검색"
                    className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                  />
                  {seriesSearch && (
                    <button
                      type="button"
                      onClick={() => setSeriesSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1 text-zinc-600 hover:text-zinc-300"
                      aria-label="시리즈 검색어 지우기"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap content-start justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSeries(null)}
                    className={`flex min-w-[84px] shrink-0 grow-0 items-center self-start rounded-lg border px-3 py-2 text-left text-[11px] font-medium leading-4 whitespace-nowrap ${
                      safeSelectedSeries === null
                        ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                        : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <span className="mr-1.5 flex h-4 w-3.5 shrink-0 items-center justify-center text-center">
                      {safeSelectedSeries === null ? "✓" : "○"}
                    </span>
                    <span className="shrink-0">없음</span>
                  </button>

                  {series
                    .filter((item) =>
                      item.name.toLowerCase().includes(seriesSearch.trim().toLowerCase())
                    )
                    .map((item) => {
                      const selected = safeSelectedSeries === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setSelectedSeries(
                              selected ? null : item.id
                            )
                          }
                          className={`flex min-w-[84px] shrink-0 grow-0 items-center self-start rounded-lg border px-3 py-2 text-left text-[11px] font-medium leading-4 whitespace-nowrap ${
                            selected
                              ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                              : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                          }`}
                        >
                          <span className="mr-1.5 flex h-4 w-3.5 shrink-0 items-center justify-center text-center">
                            {selected ? "✓" : "○"}
                          </span>
                          <span className="shrink-0">{item.name}</span>
                        </button>
                      );
                    })}

                  {series.filter((item) =>
                    item.name.toLowerCase().includes(seriesSearch.trim().toLowerCase())
                  ).length === 0 && (
                    <p className="w-full py-8 text-center text-xs text-zinc-600">
                      검색 결과가 없습니다.
                    </p>
                  )}
                </div>
              </section>
            )}
            {/* 연계 */}
            {activeMenu === "related" && (
              <section>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-zinc-100">
                      연계
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedRelatedVideos([])}
                    disabled={
                      saving || safeSelectedRelatedVideos.length === 0
                    }
                    className="text-[10px] text-zinc-600 transition hover:text-zinc-300 disabled:opacity-30"
                  >
                    초기화
                  </button>
                </div>

                <input
                  type="search"
                  value={relatedSearch}
                  onChange={(e) => setRelatedSearch(e.target.value)}
                  placeholder="영상 제목 검색"
                  autoComplete="off"
                  className="mb-3 h-10 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                />

                {relatedLoading ? (
                  <div className="py-10 text-center text-xs text-zinc-600">
                    불러오는 중...
                  </div>
                ) : (
                  <>
                    {safeSelectedRelatedVideos.length > 0 &&
                      !relatedSearch.trim() && (
                        <div className="mb-4">
                          <p className="mb-2 text-[10px] text-zinc-600">
                            현재 연계
                          </p>
                          <div className="space-y-1.5">
                            {safeSelectedRelatedVideos.map((id) => {
                              const item = videos.find(
                                (candidate) => candidate.id === id
                              );
                              if (!item) return null;

                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => onNavigateToVideo(item.id)}
                                  className="flex w-full items-center gap-3 rounded-xl border border-sky-400/20 bg-sky-400/10 p-2 text-left transition hover:border-sky-400/40 hover:bg-sky-400/15"
                                >
                                  <img
                                    src={item.thumbnail_url}
                                    alt=""
                                    loading="lazy"
                                    className="h-10 w-[72px] shrink-0 rounded-lg object-cover"
                                  />
                                  <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-200">
                                    {item.title}
                                  </span>
                                  <span className="text-[11px] text-sky-300">
                                    ✓
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {relatedSearch.trim() ? (
                      <div className="space-y-1.5">
                        {videos
                          .filter((item) => item.id !== video.id)
                          .filter((item) =>
                            item.title
                              .toLocaleLowerCase("ko-KR")
                              .includes(
                                relatedSearch
                                  .trim()
                                  .toLocaleLowerCase("ko-KR")
                              )
                          )
                          .slice(0, 12)
                          .map((item) => {
                            const selected =
                              safeSelectedRelatedVideos.includes(item.id);

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => toggleRelatedVideo(item.id)}
                                className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
                                  selected
                                    ? "border-sky-400/30 bg-sky-400/10"
                                    : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                                }`}
                              >
                                <img
                                  src={item.thumbnail_url}
                                  alt=""
                                  loading="lazy"
                                  className="h-10 w-[72px] shrink-0 rounded-lg object-cover"
                                />
                                <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-300">
                                  {item.title}
                                </span>
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-800 text-[11px]">
                                  {selected ? "✓" : ""}
                                </span>
                              </button>
                            );
                          })}

                        {videos
                          .filter((item) => item.id !== video.id)
                          .filter((item) =>
                            item.title
                              .toLocaleLowerCase("ko-KR")
                              .includes(
                                relatedSearch
                                  .trim()
                                  .toLocaleLowerCase("ko-KR")
                              )
                          ).length === 0 && (
                          <p className="py-8 text-center text-xs text-zinc-600">
                            검색 결과가 없습니다.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="py-6 text-center text-[10px] text-zinc-700">
                        검색어를 입력하면 연계할 영상을 찾을 수 있습니다.
                      </p>
                    )}

                    <p className="mt-3 text-[10px] text-zinc-600">
                      {safeSelectedRelatedVideos.length}개 선택됨
                    </p>
                  </>
                )}
              </section>
            )}

          </main>
        </div>

        {/* 하단 */}
        <footer className="shrink-0 border-t border-zinc-800 bg-zinc-950 p-3 sm:p-4">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setSelectedPeople([]);
                setSelectedGenres([]);
                setSelectedTypes([]);
                setSelectedSeries(null);
                setSelectedRelatedVideos([]);
              }}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-[11px] font-medium text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
            >
              초기화
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={onSave}
              className="flex-1 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "저장 중..."
                : "변경사항 저장"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
