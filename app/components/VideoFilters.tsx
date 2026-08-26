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
  selectedPerson: string;

  selectedGenres: number[];
  selectedType: string;
  selectedSeries: string;

  sort: string;

  people: Person[];
  genres: Category[];
  types: Category[];
  series: Category[];

  setSearch: (value: string) => void;
  setDate: (value: string) => void;
  setSelectedPerson: (value: string) => void;
  setSelectedGenres: (value: number[]) => void;
  setSelectedType: (value: string) => void;
  setSelectedSeries: (value: string) => void;
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

export default function VideoFilters({
  search,
  date,
  selectedPerson,
  selectedGenres,
  selectedType,
  selectedSeries,
  sort,
  people,
  genres,
  types,
  series,
  setSearch,
  setDate,
  setSelectedPerson,
  setSelectedGenres,
  setSelectedType,
  setSelectedSeries,
  setSort,
  onReset,
}: VideoFiltersProps) {
  const [openFilter, setOpenFilter] =
    useState<string | null>(null);

  const wrapperRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setOpenFilter(null);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const selectedPersonData = people.find(
    (person) =>
      String(person.id) === selectedPerson
  );

  const selectedTypeData = types.find(
    (type) =>
      String(type.id) === selectedType
  );

  const selectedSeriesData = series.find(
    (item) =>
      String(item.id) === selectedSeries
  );

  const selectedGenreData = genres.filter(
    (genre) =>
      selectedGenres.includes(genre.id)
  );

  const toggleGenre = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(
        selectedGenres.filter(
          (id) => id !== genreId
        )
      );
    } else {
      setSelectedGenres([
        ...selectedGenres,
        genreId,
      ]);
    }
  };

  const filterButtonClass =
    "flex min-w-0 items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 text-left transition hover:border-zinc-700 hover:bg-zinc-900";

  return (
    <section
      ref={wrapperRef}
      className="relative z-20 mb-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 shadow-lg shadow-black/10"
    >
      {/* 상단 검색 */}
      <div className="flex flex-col gap-3 p-3 sm:p-4 lg:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="영상 제목 검색..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition hover:border-zinc-700 focus:border-zinc-600"
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 transition hover:text-zinc-300"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {/* 정렬 - 클릭 즉시 변경 */}
          <button
            type="button"
            onClick={() =>
              setSort(
                sort === "최신순"
                  ? "오래된순"
                  : "최신순"
              )
            }
            className={`${filterButtonClass} min-w-[130px]`}
          >
            <div>
              <p className="text-[10px] text-zinc-600">
                정렬
              </p>

              <p className="mt-0.5 truncate text-xs text-zinc-300">
                {sort}
              </p>
            </div>

            <span className="text-zinc-600">
              ⇅
            </span>
          </button>

          {/* 초기화 */}
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-zinc-800 px-3.5 text-xs text-zinc-500 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 필터 버튼 */}
      <div className="border-t border-zinc-800/70 px-3 py-3 sm:px-4">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          {/* 등장인물 */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenFilter(
                  openFilter === "person"
                    ? null
                    : "person"
                )
              }
              className={`${filterButtonClass} w-full`}
            >
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-600">
                  등장인물
                </p>

                <p className="mt-0.5 truncate text-xs text-zinc-300">
                  {selectedPersonData?.name ??
                    "전체"}
                </p>
              </div>

              <span className="text-zinc-600">
                ⌄
              </span>
            </button>

            {openFilter === "person" && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full min-w-[220px] rounded-2xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl shadow-black/40">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPerson("");
                    setOpenFilter(null);
                  }}
                  className={`mb-1 w-full rounded-xl px-3 py-2.5 text-left text-xs ${
                    selectedPerson === ""
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  전체 등장인물
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  {people.map((person) => {
                    const selected =
                      selectedPerson ===
                      String(person.id);

                    const color =
                      personColors[
                        person.name
                      ] ??
                      "border-zinc-700 bg-zinc-900 text-zinc-400";

                    return (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => {
                          setSelectedPerson(
                            selected
                              ? ""
                              : String(person.id)
                          );
                          setOpenFilter(null);
                        }}
                        className={`rounded-xl border px-2.5 py-2 text-xs transition ${
                          selected
                            ? color
                            : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        {person.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 장르 */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenFilter(
                  openFilter === "genre"
                    ? null
                    : "genre"
                )
              }
              className={`${filterButtonClass} w-full`}
            >
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-600">
                  장르
                </p>

                <p className="mt-0.5 truncate text-xs text-zinc-300">
                  {selectedGenres.length ===
                  0
                    ? "전체"
                    : selectedGenres.length ===
                      1
                    ? selectedGenreData[0]?.name
                    : `${selectedGenres.length}개 선택`}
                </p>
              </div>

              <span className="text-zinc-600">
                ⌄
              </span>
            </button>

            {openFilter === "genre" && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[280px] rounded-2xl border border-zinc-800 bg-zinc-950 p-3 shadow-2xl shadow-black/40">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-300">
                    장르 선택
                  </span>

                  {selectedGenres.length >
                    0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedGenres([])
                      }
                      className="text-[10px] text-zinc-600 hover:text-zinc-300"
                    >
                      전체 해제
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {genres.map(
                    (genre, index) => {
                      const selected =
                        selectedGenres.includes(
                          genre.id
                        );

                      const color =
                        genreColors[
                          index %
                            genreColors.length
                        ];

                      return (
                        <button
                          key={genre.id}
                          type="button"
                          onClick={() =>
                            toggleGenre(
                              genre.id
                            )
                          }
                          className={`rounded-xl border px-2.5 py-2 text-xs transition ${
                            selected
                              ? color
                              : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                          }`}
                        >
                          {genre.name}
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setOpenFilter(null)
                  }
                  className="mt-3 w-full rounded-xl bg-white py-2 text-xs font-semibold text-black hover:bg-zinc-200"
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
              onClick={() =>
                setOpenFilter(
                  openFilter === "type"
                    ? null
                    : "type"
                )
              }
              className={`${filterButtonClass} w-full`}
            >
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-600">
                  콘텐츠 타입
                </p>

                <p className="mt-0.5 truncate text-xs text-zinc-300">
                  {selectedTypeData?.name ??
                    "전체"}
                </p>
              </div>

              <span className="text-zinc-600">
                ⌄
              </span>
            </button>

            {openFilter === "type" && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[220px] rounded-2xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl shadow-black/40">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType("");
                    setOpenFilter(null);
                  }}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-xs ${
                    selectedType === ""
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  전체 타입
                </button>

                {types.map((type) => {
                  const selected =
                    selectedType ===
                    String(type.id);

                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setSelectedType(
                          selected
                            ? ""
                            : String(type.id)
                        );
                        setOpenFilter(null);
                      }}
                      className={`mt-1 w-full rounded-xl px-3 py-2.5 text-left text-xs ${
                        selected
                          ? "bg-blue-400/10 text-blue-300"
                          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                      }`}
                    >
                      {type.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 시리즈 */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenFilter(
                  openFilter === "series"
                    ? null
                    : "series"
                )
              }
              className={`${filterButtonClass} w-full`}
            >
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-600">
                  시리즈
                </p>

                <p className="mt-0.5 truncate text-xs text-zinc-300">
                  {selectedSeriesData?.name ??
                    "전체"}
                </p>
              </div>

              <span className="text-zinc-600">
                ⌄
              </span>
            </button>

            {openFilter === "series" && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[240px] rounded-2xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl shadow-black/40">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSeries("");
                    setOpenFilter(null);
                  }}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-xs ${
                    selectedSeries === ""
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  전체 시리즈
                </button>

                {series.map((item) => {
                  const selected =
                    selectedSeries ===
                    String(item.id);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedSeries(
                          selected
                            ? ""
                            : String(item.id)
                        );
                        setOpenFilter(null);
                      }}
                      className={`mt-1 w-full rounded-xl px-3 py-2.5 text-left text-xs ${
                        selected
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 날짜 */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenFilter(
                  openFilter === "date"
                    ? null
                    : "date"
                )
              }
              className={`${filterButtonClass} w-full`}
            >
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-600">
                  날짜
                </p>

                <p className="mt-0.5 truncate text-xs text-zinc-300">
                  {date || "전체 날짜"}
                </p>
              </div>

              <span className="text-zinc-600">
                ⌄
              </span>
            </button>

            {/* 날짜 팝업 */}
            {openFilter === "date" && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[240px] rounded-2xl border border-zinc-800 bg-zinc-950 p-3 shadow-2xl shadow-black/40">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-300">
                    업로드 날짜
                  </span>

                  {date && (
                    <button
                      type="button"
                      onClick={() =>
                        setDate("")
                      }
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
                    setDate(
                      e.target.value
                    );
                    setOpenFilter(null);
                  }}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}