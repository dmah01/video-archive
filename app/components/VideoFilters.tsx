"use client";

import { useEffect, useRef, useState } from "react";
import type { Category, Person } from "../lib/archive-types";

type VideoFiltersProps = {
  search: string;
  date: string;

  selectedPeople: number[];
  selectedGenres: number[];
  selectedTypes: number[];
  selectedSeries: number[];

  sort: string;

  people: Person[];
  genres: Category[];
  types: Category[];
  series: Category[];

  setSearch: (value: string) => void;
  setDate: (value: string) => void;

  setSelectedPeople: (value: number[]) => void;
  setSelectedGenres: (value: number[]) => void;
  setSelectedTypes: (value: number[]) => void;
  setSelectedSeries: (value: number[]) => void;

  setSort: (value: string) => void;
  onReset: () => void;
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

const genreColor = "border-purple-400/40 bg-purple-400/15 text-purple-300";

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

    return 0;
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

const popupClass =
  "fixed inset-x-2 bottom-2 z-[70] max-h-[52dvh] overflow-y-auto rounded-xl pb-[env(safe-area-inset-bottom)] border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl shadow-black/50 sm:absolute sm:inset-x-auto sm:bottom-auto sm:max-h-[60vh] sm:w-[640px] sm:max-w-[calc(100vw-1.5rem)] sm:rounded-2xl sm:p-3";

export default function VideoFilters({
  search,
  date,
  selectedPeople,
  selectedGenres,
  selectedTypes,
  selectedSeries,
  sort,
  people,
  genres,
  types,
  series,
  setSearch,
  setDate,
  setSelectedPeople,
  setSelectedGenres,
  setSelectedTypes,
  setSelectedSeries,
  setSort,
  onReset,
}: VideoFiltersProps) {
  const safeSelectedPeople = selectedPeople ?? [];
  const safeSelectedGenres = selectedGenres ?? [];
  const safeSelectedTypes = selectedTypes ?? [];
  const safeSelectedSeries = selectedSeries ?? [];

  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [seriesSearch, setSeriesSearch] = useState("");
  const [seriesPage, setSeriesPage] = useState(1);
  const SERIES_PER_PAGE = 15;
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 팝업 안에서 고른 값을 "적용"을 누를 때만 실제 필터에 반영한다.
  const [draftPeople, setDraftPeople] = useState<number[]>(safeSelectedPeople);
  const [draftGenres, setDraftGenres] = useState<number[]>(safeSelectedGenres);
  const [draftTypes, setDraftTypes] = useState<number[]>(safeSelectedTypes);
  const [draftSeries, setDraftSeries] = useState<number[]>(safeSelectedSeries);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        // 적용하지 않은 임시 선택은 버린다.
        setDraftPeople(safeSelectedPeople);
        setDraftGenres(safeSelectedGenres);
        setDraftTypes(safeSelectedTypes);
        setDraftSeries(safeSelectedSeries);
        setSeriesSearch("");
        setOpenFilter(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    selectedPeople,
    selectedGenres,
    selectedTypes,
    selectedSeries,
  ]);

  useEffect(() => {
    setSeriesPage(1);
  }, [seriesSearch]);

  const openMenu = (menu: string) => {
    if (openFilter === menu) {
      setOpenFilter(null);
      if (menu === "series") setSeriesSearch("");
      return;
    }

    // 메뉴를 열 때 현재 적용값으로 임시값을 동기화한다.
    setDraftPeople(safeSelectedPeople);
    setDraftGenres(safeSelectedGenres);
    setDraftTypes(safeSelectedTypes);
    setDraftSeries(safeSelectedSeries);
    if (menu === "series") setSeriesSearch("");
    setOpenFilter(menu);
  };

  const applyMenu = () => {
    setSelectedPeople(draftPeople);
    setSelectedGenres(draftGenres);
    setSelectedTypes(draftTypes);
    setSelectedSeries(draftSeries);
    setOpenFilter(null);
  };

  const toggle = (
    current: number[],
    id: number,
    setter: (value: number[]) => void
  ) => {
    setter(
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const selectedPersonData = people.filter((item) =>
    safeSelectedPeople.includes(item.id)
  );
  const selectedGenreData = genres.filter((item) =>
    safeSelectedGenres.includes(item.id)
  );
  const selectedTypeData = types.filter((item) =>
    safeSelectedTypes.includes(item.id)
  );
  const selectedSeriesData = series.filter((item) =>
    safeSelectedSeries.includes(item.id)
  );

  const filterButtonClass =
    "flex min-w-0 min-h-9 items-center justify-between gap-1 rounded-lg border border-zinc-800 bg-zinc-950/70 px-1.5 py-1.5 text-left transition hover:border-zinc-700 hover:bg-zinc-900 sm:min-h-11 sm:gap-3 sm:rounded-xl sm:px-3.5 sm:py-2.5";

  const selectionText = (
    values: Category[] | Person[],
    count: number,
    allText: string
  ) => {
    if (count === 0) return allText;
    if (count === 1) return values[0]?.name ?? allText;
    return `${count}개 선택`;
  };

  return (
    <>
      {openFilter && (
        <button
          type="button"
          aria-label="필터 닫기"
          onClick={() => {
            setDraftPeople(safeSelectedPeople);
            setDraftGenres(safeSelectedGenres);
            setDraftTypes(safeSelectedTypes);
            setDraftSeries(safeSelectedSeries);
            setSeriesSearch("");
            setOpenFilter(null);
          }}
          className="fixed inset-0 z-30 bg-black/40 sm:hidden"
        />
      )}

      <section
        ref={wrapperRef}
        className="filter-panel relative z-40 mb-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 shadow-lg shadow-black/10"
      >
      {/* 상단 검색 */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5 p-2 sm:flex sm:gap-2 sm:p-3 lg:flex-row lg:p-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="영상 제목 검색"
            className="search-input h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-2.5 py-2 text-base sm:h-auto sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition hover:border-zinc-700 focus:border-zinc-600"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-1 text-zinc-600 transition hover:text-zinc-300"
            >
              ×
            </button>
          )}
        </div>

        <div className="contents sm:flex sm:gap-2">
          <button
            type="button"
            onClick={() =>
              setSort(sort === "최신순" ? "오래된순" : "최신순")
            }
            className={`${filterButtonClass} h-10 min-w-0 px-2 sm:h-11 sm:min-w-[130px]`}
          >
            <div className="min-w-0">
              <p className="truncate text-[8px] text-zinc-600 sm:text-[10px]">정렬</p>
              <p className="mt-0.5 truncate text-[9px] text-zinc-300 sm:text-xs">
                {sort}
              </p>
            </div>
            <span className="text-zinc-600">⇅</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="h-10 rounded-lg border border-zinc-800 px-2.5 text-[10px] sm:min-h-11 sm:rounded-xl sm:px-3.5 sm:text-xs text-zinc-500 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 필터 버튼 */}
      <div className="border-t border-zinc-800/70 px-2 py-1.5 sm:px-4 sm:py-2.5">
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5 lg:gap-2">
          {/* 멤버 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => openMenu("people")}
              className={`${filterButtonClass} w-full`}
            >
              <div className="min-w-0">
                <p className="truncate text-[8px] text-zinc-600 sm:text-[10px]">멤버</p>
                <p className="mt-0.5 truncate text-[9px] text-zinc-300 sm:text-xs">
                  {selectionText(
                    selectedPersonData,
                    safeSelectedPeople.length,
                    "전체"
                  )}
                </p>
              </div>
              <span className="text-zinc-600">⌄</span>
            </button>

            {openFilter === "people" && (
              <div
  className={`filter-popup ${popupClass} sm:left-0 sm:top-[calc(100%+8px)] sm:!w-[400px]`}
>
                <div className="mb-1.5 flex items-center justify-between sm:mb-2">
                  <span className="text-[11px] font-medium text-zinc-300 sm:text-xs">
                    멤버 선택
                  </span>
                  {draftPeople.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDraftPeople([])}
                      className="text-[10px] text-zinc-600 hover:text-zinc-300"
                    >
                      전체 해제
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-start gap-1.5 sm:gap-2">
                  {sortPeople(people).map((person, index) => {
                    const selected = draftPeople.includes(person.id);
                    const color =
                      personColors[person.name] ??
                      "border-zinc-700 bg-zinc-900 text-zinc-400";

                    return (
                      <span key={`person-wrap-${person.id}`} className="contents">
                        {index === 6 && (
                          <span
                            aria-hidden="true"
                            className="basis-full h-0"
                          />
                        )}
                        <button
                          key={person.id}
                        type="button"
                        onClick={() =>
                          toggle(
                            draftPeople,
                            person.id,
                            setDraftPeople
                          )
                        }
                        className={`min-h-9 w-auto whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[10px] leading-4 transition active:scale-[0.98] sm:min-h-9 sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-[11px] ${
                          selected
                            ? color
                            : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                          {person.name}
                        </button>
                      </span>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={applyMenu}
                  className="mt-2 w-full rounded-lg bg-white py-2 text-[11px] font-semibold text-black hover:bg-zinc-200 sm:mt-2 sm:rounded-xl sm:py-2 sm:text-xs"
                >
                  적용
                </button>
              </div>
            )}
          </div>

          {/* 장르 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => openMenu("genres")}
              className={`${filterButtonClass} w-full`}
            >
              <div className="min-w-0">
                <p className="truncate text-[8px] text-zinc-600 sm:text-[10px]">장르</p>
                <p className="mt-0.5 truncate text-[9px] text-zinc-300 sm:text-xs">
                  {selectionText(
                    selectedGenreData,
                    safeSelectedGenres.length,
                    "전체"
                  )}
                </p>
              </div>
              <span className="text-zinc-600">⌄</span>
            </button>

            {openFilter === "genres" && (
              <div className={`filter-popup ${popupClass} sm:left-0 sm:top-[calc(100%+8px)] sm:!w-[680px]`}>
                <div className="mb-1.5 flex items-center justify-between sm:mb-2">
                  <span className="text-[11px] font-medium text-zinc-300 sm:text-xs">
                    장르 선택
                  </span>
                  {draftGenres.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDraftGenres([])}
                      className="text-[10px] text-zinc-600 hover:text-zinc-300"
                    >
                      전체 해제
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {sortGenres(genres).map((genre, index) => {
                    const selected = draftGenres.includes(genre.id);
                    const color = genreColor;

                    return (
                      <button
                        key={genre.id}
                        type="button"
                        onClick={() =>
                          toggle(
                            draftGenres,
                            genre.id,
                            setDraftGenres
                          )
                        }
                        className={`min-h-9 w-auto whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[10px] leading-4 transition active:scale-[0.98] sm:min-h-9 sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-[11px] ${
                          selected
                            ? color
                            : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        {selected ? "✓ " : ""}
                        {genre.name}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={applyMenu}
                  className="mt-2 w-full rounded-lg bg-white py-2 text-[11px] font-semibold text-black hover:bg-zinc-200 sm:mt-2 sm:rounded-xl sm:py-2 sm:text-xs"
                >
                  적용
                </button>
              </div>
            )}
          </div>

          {/* 타입 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => openMenu("types")}
              className={`${filterButtonClass} w-full`}
            >
              <div className="min-w-0">
                <p className="leading-3 text-[8px] text-zinc-600 sm:text-[10px] sm:leading-4">타입</p>
                <p className="mt-0.5 truncate text-[9px] text-zinc-300 sm:text-xs">
                  {selectionText(
                    selectedTypeData,
                    safeSelectedTypes.length,
                    "전체"
                  )}
                </p>
              </div>
              <span className="text-zinc-600">⌄</span>
            </button>

            {openFilter === "types" && (
              <div className={`filter-popup ${popupClass} sm:left-0 sm:top-[calc(100%+8px)]`}>
                <div className="mb-1.5 flex items-center justify-between sm:mb-2">
                  <span className="text-[11px] font-medium text-zinc-300 sm:text-xs">
                    타입 선택
                  </span>
                  {draftTypes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDraftTypes([])}
                      className="text-[10px] text-zinc-600 hover:text-zinc-300"
                    >
                      전체 해제
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {types.map((type) => {
                    const selected = draftTypes.includes(type.id);

                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() =>
                          toggle(
                            draftTypes,
                            type.id,
                            setDraftTypes
                          )
                        }
                        className={`min-h-9 w-auto whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[10px] leading-4 transition active:scale-[0.98] sm:min-h-9 sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-[11px] ${
                          selected
                            ? "border-indigo-400/30 bg-indigo-400/10 text-indigo-300"
                            : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        {selected ? "✓ " : ""}
                        {type.name}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={applyMenu}
                  className="mt-2 w-full rounded-lg bg-white py-2 text-[11px] font-semibold text-black hover:bg-zinc-200 sm:mt-2 sm:rounded-xl sm:py-2 sm:text-xs"
                >
                  적용
                </button>
              </div>
            )}
          </div>

          {/* 시리즈 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => openMenu("series")}
              className={`${filterButtonClass} w-full`}
            >
              <div className="min-w-0">
                <p className="truncate text-[8px] text-zinc-600 sm:text-[10px]">
                  시리즈
                </p>
                <p className="mt-0.5 truncate text-[9px] text-zinc-300 sm:text-xs">
                  {selectionText(
                    selectedSeriesData,
                    safeSelectedSeries.length,
                    "전체"
                  )}
                </p>
              </div>
              <span className="shrink-0 pl-1 text-zinc-600">⌄</span>
            </button>

            {openFilter === "series" && (
              <div
                className={`${popupClass} !w-[680px] !max-w-[calc(100vw-1rem)] sm:right-0 sm:top-[calc(100%+8px)]`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium text-zinc-300 sm:text-xs">
                    시리즈 선택
                  </span>

                  {draftSeries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDraftSeries([])}
                      className="shrink-0 text-[10px] text-zinc-600 hover:text-zinc-300"
                    >
                      전체 해제
                    </button>
                  )}
                </div>

                <div className="relative z-10 mb-2.5">
                  <input
                    type="search"
                    value={seriesSearch}
                    onChange={(e) => setSeriesSearch(e.target.value)}
                    placeholder="시리즈 이름을 입력하세요..."
                    autoComplete="off"
                    className="h-10 w-full min-w-0 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
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

                {(() => {
                  const filteredSeries = series.filter((item) =>
                    item.name
                      .toLocaleLowerCase("ko-KR")
                      .includes(
                        seriesSearch
                          .trim()
                          .toLocaleLowerCase("ko-KR")
                      )
                  );

                  const totalSeriesPages = Math.max(
                    1,
                    Math.ceil(filteredSeries.length / SERIES_PER_PAGE)
                  );

                  const safePage = Math.min(seriesPage, totalSeriesPages);
                  const start = (safePage - 1) * SERIES_PER_PAGE;
                  const paginatedSeries = filteredSeries.slice(
                    start,
                    start + SERIES_PER_PAGE
                  );

                  return (
                    <>
                      <div className="flex max-h-[42vh] flex-wrap items-start gap-1.5 overflow-y-auto sm:max-h-[48vh] sm:gap-2">
                        {paginatedSeries.map((item) => {
                          const selected = draftSeries.includes(item.id);

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                setDraftSeries(
                                  draftSeries.includes(item.id)
                                    ? []
                                    : [item.id]
                                )
                              }
                              className={`min-h-9 w-auto whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[10px] leading-4 transition active:scale-[0.98] sm:min-h-9 sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-[11px] ${
                                selected
                                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                  : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                              }`}
                            >
                              {selected ? "✓ " : ""}
                              {item.name}
                            </button>
                          );
                        })}

                        {filteredSeries.length === 0 && (
                          <p className="w-full py-6 text-center text-xs text-zinc-600">
                            검색 결과가 없습니다.
                          </p>
                        )}
                      </div>

                      {totalSeriesPages > 1 && (
                        <div className="mt-3 flex items-center justify-center gap-1.5 border-t border-zinc-800/70 pt-3">
                          <button
                            type="button"
                            onClick={() =>
                              setSeriesPage((page) => Math.max(1, page - 1))
                            }
                            disabled={safePage === 1}
                            className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[10px] text-zinc-400 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            이전
                          </button>

                          <span className="min-w-[90px] text-center text-[10px] text-zinc-500">
                            {safePage} / {totalSeriesPages}
                            <span className="ml-1 text-zinc-700">
                              ({filteredSeries.length}개)
                            </span>
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setSeriesPage((page) =>
                                Math.min(totalSeriesPages, page + 1)
                              )
                            }
                            disabled={safePage === totalSeriesPages}
                            className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[10px] text-zinc-400 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            다음
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}

                <button
                  type="button"
                  onClick={applyMenu}
                  className="mt-2 w-full rounded-lg bg-white py-2 text-[11px] font-semibold text-black hover:bg-zinc-200 sm:mt-2 sm:rounded-xl sm:py-2 sm:text-xs"
                >
                  적용
                </button>
              </div>
            )}
          </div>

          {/* 날짜 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => openMenu("date")}
              className={`${filterButtonClass} w-full`}
            >
              <div className="min-w-0">
                <p className="truncate text-[8px] text-zinc-600 sm:text-[10px]">날짜</p>
                <p className="mt-0.5 truncate text-[9px] text-zinc-300 sm:text-xs">
                  {date || "전체 날짜"}
                </p>
              </div>
              <span className="text-zinc-600">⌄</span>
            </button>

            {openFilter === "date" && (
              <div
                className={`filter-popup ${popupClass} sm:right-0 sm:top-[calc(100%+8px)] sm:max-w-[calc(100vw-1.5rem)]`}
              >
                <div className="mb-1.5 flex items-center justify-between sm:mb-2">
                  <span className="text-[11px] font-medium text-zinc-300 sm:text-xs">
                    업로드 날짜
                  </span>
                  {date && (
                    <button
                      type="button"
                      onClick={() => setDate("")}
                      className="text-[10px] text-zinc-600 hover:text-zinc-300"
                    >
                      초기화
                    </button>
                  )}
                </div>

                <input
                  autoFocus
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                  }}
                  className="block h-11 w-full min-w-0 appearance-none rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-base text-zinc-200 outline-none focus:border-zinc-600 sm:h-10 sm:rounded-xl sm:px-3 sm:text-xs"
                />

                <button
                  type="button"
                  onClick={() => setOpenFilter(null)}
                  className="mt-1.5 min-h-9 w-full rounded-lg bg-white py-2 text-[10px] font-semibold text-black sm:hidden"
                >
                  적용
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </section>
    </>
  );
}
