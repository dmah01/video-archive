"use client";

import { useEffect, useRef, useState } from "react";

type Person = {
  id: number;
  name: string;
};

type Category = {
  id: number;
  name: string;
};

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

const genreColors = [
  "border-purple-400/30 bg-purple-400/10 text-purple-300",
  "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  "border-indigo-400/30 bg-indigo-400/10 text-indigo-300",
  "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  "border-amber-400/30 bg-amber-400/10 text-amber-300",
];

const popupClass =
  "fixed inset-x-2 bottom-2 z-[70] max-h-[60dvh] overflow-y-auto rounded-xl pb-[env(safe-area-inset-bottom)] border border-zinc-800 bg-zinc-950 p-2 shadow-2xl shadow-black/50 sm:absolute sm:inset-x-auto sm:bottom-auto sm:max-h-[60vh] sm:w-[280px] sm:rounded-2xl sm:p-3";

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
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 팝업 안에서 고른 값을 "적용"을 누를 때만 실제 필터에 반영한다.
  const [draftPeople, setDraftPeople] = useState<number[]>(selectedPeople);
  const [draftGenres, setDraftGenres] = useState<number[]>(selectedGenres);
  const [draftTypes, setDraftTypes] = useState<number[]>(selectedTypes);
  const [draftSeries, setDraftSeries] = useState<number[]>(selectedSeries);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        // 적용하지 않은 임시 선택은 버린다.
        setDraftPeople(selectedPeople);
        setDraftGenres(selectedGenres);
        setDraftTypes(selectedTypes);
        setDraftSeries(selectedSeries);
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

  const openMenu = (menu: string) => {
    if (openFilter === menu) {
      setOpenFilter(null);
      return;
    }

    // 메뉴를 열 때 현재 적용값으로 임시값을 동기화한다.
    setDraftPeople(selectedPeople);
    setDraftGenres(selectedGenres);
    setDraftTypes(selectedTypes);
    setDraftSeries(selectedSeries);
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
    selectedPeople.includes(item.id)
  );
  const selectedGenreData = genres.filter((item) =>
    selectedGenres.includes(item.id)
  );
  const selectedTypeData = types.filter((item) =>
    selectedTypes.includes(item.id)
  );
  const selectedSeriesData = series.filter((item) =>
    selectedSeries.includes(item.id)
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
            setDraftPeople(selectedPeople);
            setDraftGenres(selectedGenres);
            setDraftTypes(selectedTypes);
            setDraftSeries(selectedSeries);
            setOpenFilter(null);
          }}
          className="fixed inset-0 z-30 bg-black/40 sm:hidden"
        />
      )}

      <section
        ref={wrapperRef}
        className="relative z-40 mb-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 shadow-lg shadow-black/10"
      >
      {/* 상단 검색 */}
      <div className="flex flex-col gap-2.5 p-2.5 sm:gap-3 sm:p-4 lg:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="영상 제목 검색..."
            className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-3 text-sm sm:h-auto sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition hover:border-zinc-700 focus:border-zinc-600"
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

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={() =>
              setSort(sort === "최신순" ? "오래된순" : "최신순")
            }
            className={`${filterButtonClass} min-w-0 sm:min-w-[130px]`}
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
            className="min-h-11 rounded-xl border border-zinc-800 px-3.5 text-xs text-zinc-500 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 필터 버튼 */}
      <div className="border-t border-zinc-800/70 px-2.5 py-2 sm:px-4 sm:py-3">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {/* 등장인물 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => openMenu("people")}
              className={`${filterButtonClass} w-full`}
            >
              <div className="min-w-0">
                <p className="truncate text-[8px] text-zinc-600 sm:text-[10px]">등장인물</p>
                <p className="mt-0.5 truncate text-[9px] text-zinc-300 sm:text-xs">
                  {selectionText(
                    selectedPersonData,
                    selectedPeople.length,
                    "전체"
                  )}
                </p>
              </div>
              <span className="text-zinc-600">⌄</span>
            </button>

            {openFilter === "people" && (
              <div className={`${popupClass} sm:left-0 sm:top-[calc(100%+8px)]`}>
                <div className="mb-1.5 flex items-center justify-between sm:mb-2">
                  <span className="text-[11px] font-medium text-zinc-300 sm:text-xs">
                    등장인물 선택
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

                <div className="grid grid-cols-2 gap-1.5">
                  {people.map((person) => {
                    const selected = draftPeople.includes(person.id);
                    const color =
                      personColors[person.name] ??
                      "border-zinc-700 bg-zinc-900 text-zinc-400";

                    return (
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
                        className={`min-h-9 rounded-lg border px-2 py-1.5 text-[10px] leading-4 transition active:scale-[0.98] sm:min-h-0 sm:rounded-xl sm:px-2.5 sm:py-2 sm:text-xs ${
                          selected
                            ? color
                            : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        {selected ? "✓ " : ""}
                        {person.name}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={applyMenu}
                  className="mt-2 w-full rounded-lg bg-white py-2 text-[11px] font-semibold text-black hover:bg-zinc-200 sm:mt-3 sm:rounded-xl sm:py-2.5 sm:text-xs"
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
                    selectedGenres.length,
                    "전체"
                  )}
                </p>
              </div>
              <span className="text-zinc-600">⌄</span>
            </button>

            {openFilter === "genres" && (
              <div className={`${popupClass} sm:left-0 sm:top-[calc(100%+8px)]`}>
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

                <div className="grid grid-cols-2 gap-1.5">
                  {genres.map((genre, index) => {
                    const selected = draftGenres.includes(genre.id);
                    const color =
                      genreColors[index % genreColors.length];

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
                        className={`min-h-9 rounded-lg border px-2 py-1.5 text-[10px] leading-4 transition active:scale-[0.98] sm:min-h-0 sm:rounded-xl sm:px-2.5 sm:py-2 sm:text-xs ${
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
                  className="mt-2 w-full rounded-lg bg-white py-2 text-[11px] font-semibold text-black hover:bg-zinc-200 sm:mt-3 sm:rounded-xl sm:py-2.5 sm:text-xs"
                >
                  적용
                </button>
              </div>
            )}
          </div>

          {/* 콘텐츠 타입 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => openMenu("types")}
              className={`${filterButtonClass} w-full`}
            >
              <div className="min-w-0">
                <p className="truncate text-[8px] text-zinc-600 sm:text-[10px]">콘텐츠 타입</p>
                <p className="mt-0.5 truncate text-[9px] text-zinc-300 sm:text-xs">
                  {selectionText(
                    selectedTypeData,
                    selectedTypes.length,
                    "전체"
                  )}
                </p>
              </div>
              <span className="text-zinc-600">⌄</span>
            </button>

            {openFilter === "types" && (
              <div className={`${popupClass} sm:left-0 sm:top-[calc(100%+8px)]`}>
                <div className="mb-1.5 flex items-center justify-between sm:mb-2">
                  <span className="text-[11px] font-medium text-zinc-300 sm:text-xs">
                    콘텐츠 타입 선택
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

                <div className="grid grid-cols-2 gap-1.5">
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
                        className={`min-h-9 rounded-lg border px-2 py-1.5 text-[10px] leading-4 transition active:scale-[0.98] sm:min-h-0 sm:rounded-xl sm:px-2.5 sm:py-2 sm:text-xs ${
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
                  className="mt-2 w-full rounded-lg bg-white py-2 text-[11px] font-semibold text-black hover:bg-zinc-200 sm:mt-3 sm:rounded-xl sm:py-2.5 sm:text-xs"
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
                <p className="truncate text-[8px] text-zinc-600 sm:text-[10px]">시리즈</p>
                <p className="mt-0.5 truncate text-[9px] text-zinc-300 sm:text-xs">
                  {selectionText(
                    selectedSeriesData,
                    selectedSeries.length,
                    "전체"
                  )}
                </p>
              </div>
              <span className="text-zinc-600">⌄</span>
            </button>

            {openFilter === "series" && (
              <div className={`${popupClass} sm:right-0 sm:top-[calc(100%+8px)] sm:max-w-[280px]`}>
                <div className="mb-1.5 flex items-center justify-between sm:mb-2">
                  <span className="text-[11px] font-medium text-zinc-300 sm:text-xs">
                    시리즈 선택
                  </span>
                  {draftSeries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDraftSeries([])}
                      className="text-[10px] text-zinc-600 hover:text-zinc-300"
                    >
                      전체 해제
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {series.map((item) => {
                    const selected = draftSeries.includes(item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          toggle(
                            draftSeries,
                            item.id,
                            setDraftSeries
                          )
                        }
                        className={`min-h-9 rounded-lg border px-2 py-1.5 text-[10px] leading-4 transition active:scale-[0.98] sm:min-h-0 sm:rounded-xl sm:px-2.5 sm:py-2 sm:text-xs ${
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
                </div>

                <button
                  type="button"
                  onClick={applyMenu}
                  className="mt-2 w-full rounded-lg bg-white py-2 text-[11px] font-semibold text-black hover:bg-zinc-200 sm:mt-3 sm:rounded-xl sm:py-2.5 sm:text-xs"
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
                className={`${popupClass} sm:right-0 sm:top-[calc(100%+8px)] sm:max-w-[280px]`}
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
                  className="block h-11 w-full min-w-0 appearance-none rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600 sm:h-10 sm:rounded-xl sm:px-3 sm:text-xs"
                />

                <button
                  type="button"
                  onClick={() => setOpenFilter(null)}
                  className="mt-2 min-h-11 w-full rounded-lg bg-white py-2.5 text-xs font-semibold text-black sm:hidden"
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
