"use client";

import {
  useEffect,
  useState,
} from "react";

type Person = {
  id: number;
  name: string;
};

type Category = {
  id: number;
  name: string;
};

type Video = {
  id: number;
  title: string;
  peopleIds?: number[];
  genreIds?: number[];
  typeId?: number | null;
  seriesId?: number | null;
};

type VideoEditorProps = {
  video: Video | null;

  people: Person[];
  genres: Category[];
  types: Category[];
  series: Category[];

  selectedPeople: number[];
  selectedGenres: number[];

  selectedType: number | null;
  selectedSeries: number | null;

  saving: boolean;

  setSelectedPeople: React.Dispatch<
    React.SetStateAction<number[]>
  >;

  setSelectedGenres: React.Dispatch<
    React.SetStateAction<number[]>
  >;

  setSelectedType: React.Dispatch<
    React.SetStateAction<number | null>
  >;

  setSelectedSeries: React.Dispatch<
    React.SetStateAction<number | null>
  >;

  onSave: () => void;
  onClose: () => void;
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
  "스토리",
  "추리",
  "상황극",
  "공포 / 스릴",
  "예능 / 개그",
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


type Menu = "people" | "genres" | "type" | "series";

export default function VideoEditor({
  video,
  people,
  genres,
  types,
  series,
  selectedPeople,
  selectedGenres,
  selectedType,
  selectedSeries,
  saving,
  setSelectedPeople,
  setSelectedGenres,
  setSelectedType,
  setSelectedSeries,
  onSave,
  onClose,
}: VideoEditorProps) {
  const [activeMenu, setActiveMenu] =
    useState<Menu>("people");


  /*
   * 다른 영상을 열 때마다
   * 항상 등장인물 메뉴부터 표시
   */
  useEffect(() => {
    if (video) {
      setActiveMenu("people");
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

  const menuClass = (menu: Menu) =>
    `flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[11px] font-medium transition ${
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

        {/* 본문 */}
        <div className="flex min-h-0 flex-1">

          {/* 메뉴 */}
          <aside className="w-[112px] shrink-0 border-r border-zinc-800/80 bg-zinc-950 p-1.5 sm:w-[132px] sm:p-2.5">
            <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-wider text-zinc-700">
              Settings
            </p>

            <button
              type="button"
              onClick={() =>
                setActiveMenu("people")
              }
              className={menuClass("people")}
            >
              <span>등장인물</span>
              <span className="text-[10px] text-zinc-600">
                {selectedPeople.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveMenu("genres")
              }
              className={menuClass("genres")}
            >
              <span>장르</span>
              <span className="text-[10px] text-zinc-600">
                {selectedGenres.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveMenu("type")
              }
              className={menuClass("type")}
            >
              <span className="shrink-0 leading-5">콘텐츠<br />타입</span>

              {selectedType !== null && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveMenu("series")
              }
              className={menuClass("series")}
            >
              <span>시리즈</span>

              {selectedSeries !== null && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          </aside>

          {/* 설정 영역 */}
          <main className="min-w-0 flex-1 overflow-y-auto p-5 sm:p-6">

            {/* 등장인물 */}
            {activeMenu === "people" && (
              <section>
                <div className="mb-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-zinc-100">
                      등장인물
                    </h3>

                    <button
                      type="button"
                      onClick={() => setSelectedPeople([])}
                      disabled={saving || selectedPeople.length === 0}
                      className="text-[10px] text-zinc-600 transition hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      초기화
                    </button>
                  </div>

                  <p className="mt-1 text-xs text-zinc-600">
                    영상에 등장한 멤버를 선택하세요.
                  </p>
                </div>

                <div className="flex flex-wrap content-start justify-start gap-2">
                  {sortPeople(people).map((person) => {
                    const selected =
                      selectedPeople.includes(person.id);

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
                <div className="mt-6 border-t border-zinc-800/70 pt-5">
                  <p className="mb-2 text-[10px] text-zinc-600">
                    현재 선택
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedPeople.length ===
                    0 ? (
                      <span className="text-xs text-zinc-700">
                        선택된 등장인물이 없습니다.
                      </span>
                    ) : (
                      selectedPeople.map(
                        (id) => {
                          const person =
                            people.find(
                              (item) =>
                                item.id === id
                            );

                          if (!person)
                            return null;

                          return (
                            <span
                              key={id}
                              className={`rounded-full border px-2.5 py-1 text-[11px] ${
                                personColors[
                                  person.name
                                ] ??
                                "border-zinc-700 bg-zinc-900 text-zinc-400"
                              }`}
                            >
                              {person.name}
                            </span>
                          );
                        }
                      )
                    )}
                  </div>
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
                      disabled={saving || selectedGenres.length === 0}
                      className="text-[10px] text-zinc-600 transition hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      초기화
                    </button>
                  </div>

                  <p className="mt-1 text-xs text-zinc-600">
                    영상에 해당하는 장르를 여러 개 선택하세요.
                  </p>
                </div>

                <div className="flex flex-wrap content-start justify-start gap-2">
                  {sortGenres(genres).map((genre) => {
                      const selected =
                        selectedGenres.includes(
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

                <div className="mt-6 border-t border-zinc-800/70 pt-5">
                  <p className="mb-2 text-[10px] text-zinc-600">
                    현재 선택
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedGenres.length ===
                    0 ? (
                      <span className="text-xs text-zinc-700">
                        선택된 장르가 없습니다.
                      </span>
                    ) : (
                      selectedGenres.map(
                        (id) => {
                          const genre =
                            genres.find(
                              (item) =>
                                item.id === id
                            );

                          if (!genre)
                            return null;

                          return (
                            <span
                              key={id}
                              className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2.5 py-1 text-[11px] text-purple-300"
                            >
                              {genre.name}
                            </span>
                          );
                        }
                      )
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* 타입 */}
            {activeMenu === "type" && (
              <section>
                <div className="mb-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-zinc-100">
                      콘텐츠 타입
                    </h3>

                    <button
                      type="button"
                      onClick={() => setSelectedType(null)}
                      disabled={saving || selectedType === null}
                      className="text-[10px] text-zinc-600 transition hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      초기화
                    </button>
                  </div>

                  <p className="mt-1 text-xs text-zinc-600">
                    영상의 콘텐츠 타입을 하나 선택하세요.
                  </p>
                </div>

                <div className="flex flex-wrap content-start justify-start gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedType(null)
                    }
                    className={`flex w-fit shrink-0 grow-0 items-center self-start rounded-lg border px-3 py-2 text-left text-[11px] font-medium leading-4 whitespace-nowrap ${
                      selectedType === null
                        ? "border-indigo-400/40 bg-indigo-400/15 text-indigo-300"
                        : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {selectedType === null
                      ? "✓ "
                      : ""}
                    없음
                  </button>

                  {types.map((type) => {
                    const selected =
                      selectedType ===
                      type.id;

                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() =>
                          setSelectedType(
                            selected
                              ? null
                              : type.id
                          )
                        }
                        className={`flex w-fit shrink-0 grow-0 items-center self-start rounded-lg border px-3 py-2 text-left text-[11px] font-medium leading-4 whitespace-nowrap ${
                          selected
                            ? "border-indigo-400/40 bg-indigo-400/15 text-indigo-300"
                            : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        {selected
                          ? "✓ "
                          : ""}
                        {type.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 시리즈 */}
            {activeMenu === "series" && (
              <section>
                <div className="mb-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-zinc-100">
                      시리즈
                    </h3>

                    <button
                      type="button"
                      onClick={() => setSelectedSeries(null)}
                      disabled={saving || selectedSeries === null}
                      className="text-[10px] text-zinc-600 transition hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      초기화
                    </button>
                  </div>

                  <p className="mt-1 text-xs text-zinc-600">
                    영상이 속한 시리즈를 하나 선택하세요.
                  </p>
                </div>

                <div className="flex flex-wrap content-start justify-start gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSeries(
                        null
                      )
                    }
                    className={`flex w-fit shrink-0 grow-0 items-center self-start rounded-lg border px-3 py-2 text-left text-[11px] font-medium leading-4 whitespace-nowrap ${
                      selectedSeries === null
                        ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                        : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {selectedSeries ===
                    null
                      ? "✓ "
                      : ""}
                    없음
                  </button>

                  {series.map((item) => {
                    const selected =
                      selectedSeries ===
                      item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setSelectedSeries(
                            selected
                              ? null
                              : item.id
                          )
                        }
                        className={`flex w-fit shrink-0 grow-0 items-center self-start rounded-lg border px-3 py-2 text-left text-[11px] font-medium leading-4 whitespace-nowrap ${
                          selected
                            ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                            : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        {selected
                          ? "✓ "
                          : ""}
                        {item.name}
                      </button>
                    );
                  })}
                </div>
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
                setSelectedType(null);
                setSelectedSeries(null);
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