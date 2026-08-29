"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import VideoCard from "./components/VideoCard";
import VideoFilters from "./components/VideoFilters";
import VideoEditor from "./components/VideoEditor";

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
  thumbnail_url: string;
  published_at: string;
  youtube_url: string;

  peopleIds?: number[];
  genreIds?: number[];

  // 콘텐츠 타입은 여러 개 선택할 수 있도록 배열로 관리합니다.
  typeIds?: number[];
  // Supabase 원본 컬럼(snake_case)도 조회 결과에서 사용합니다.
  type_ids?: number[] | null;
  type_id?: number | null;
  series_id?: number | null;

  // 앱에서 사용하는 camelCase 값
  typeId?: number | null;
  seriesId?: number | null;
};

const VIDEOS_PER_PAGE = 12;

export default function Home() {
  // =============================
  // 데이터
  // =============================

  const [videos, setVideos] = useState<Video[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [genres, setGenres] = useState<Category[]>([]);
  const [types, setTypes] = useState<Category[]>([]);
  const [series, setSeries] = useState<Category[]>([]);

  // =============================
  // 필터
  // =============================

  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  // 등장인물 / 장르 / 콘텐츠 타입 / 시리즈 모두 복수 선택
  const [selectedPeople, setSelectedPeople] = useState<number[]>([]);

  const [selectedGenres, setSelectedGenres] =
    useState<number[]>([]);

  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<number[]>([]);

  const [sort, setSort] = useState("최신순");

  // =============================
  // 상태
  // =============================

  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] =
    useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // =============================
  // 영상 편집
  // =============================

  const [editingVideo, setEditingVideo] =
    useState<Video | null>(null);

  const [editorPeople, setEditorPeople] =
    useState<number[]>([]);

  const [editorGenres, setEditorGenres] =
    useState<number[]>([]);

  const [editorTypes, setEditorTypes] =
    useState<number[]>([]);

  const [editorSeries, setEditorSeries] =
    useState<number | null>(null);

  const [savingVideo, setSavingVideo] =
    useState(false);
  const videoEditorScrollYRef = useRef(0);

  // =============================
  // 최초 로딩
  // =============================

  useEffect(() => {
    loadVideos();
    loadPeople();
    loadGenres();
    loadTypes();
    loadSeries();
  }, []);


  // =============================
  // 필터 변경
  // =============================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    date,
    selectedPeople,
    selectedGenres,
    selectedTypes,
    selectedSeries,
    sort,
  ]);

  // =============================
  // 영상 불러오기
  // =============================

  async function loadVideos() {
    setLoading(true);

    // Supabase에 저장된 영상 전체를 가져옵니다.
    // 1000개씩 나누어 가져오기 때문에 2019년 영상도 계속 웹사이트에 남습니다.
    const allVideos: Video[] = [];
    const pageSize = 1000;
    let from = 0;

    while (true) {
      const {
        data: pageData,
        error: pageError,
      } = await supabase
        .from("videos")
        .select("*")
        .order("published_at", {
          ascending: false,
        })
        .range(
          from,
          from + pageSize - 1
        );

      if (pageError) {
        console.error(
          "영상 불러오기 오류:",
          pageError
        );
        setLoading(false);
        return;
      }

      const currentVideos =
        (pageData ?? []) as Video[];

      allVideos.push(...currentVideos);

      if (currentVideos.length < pageSize) {
        break;
      }

      from += pageSize;
    }

    const data = allVideos;

    const videoIds = data.map(
      (video) => video.id
    );

    if (videoIds.length === 0) {
      setVideos([]);
      setLoading(false);
      return;
    }

    // 영상 ↔ 장르
    const {
      data: genreRelations,
      error: genreError,
    } = await supabase
      .from("video_genres")
      .select("video, genre")
      .in("video", videoIds);

    if (genreError) {
      console.error(
        "장르 연결 불러오기 오류:",
        genreError
      );
    }

    // 영상 ↔ 등장인물
    const {
      data: peopleRelations,
      error: peopleError,
    } = await supabase
      .from("video_people")
      .select("video, person")
      .in("video", videoIds);

    if (peopleError) {
      console.error(
        "등장인물 연결 불러오기 오류:",
        peopleError
      );
    }

    const videosWithRelations: Video[] =
      data.map((video) => ({
        ...video,

        peopleIds: (
          peopleRelations ?? []
        )
          .filter(
            (relation) =>
              relation.video === video.id
          )
          .map(
            (relation) =>
              relation.person
          ),

        genreIds: (
          genreRelations ?? []
        )
          .filter(
            (relation) =>
              relation.video === video.id
          )
          .map(
            (relation) =>
              relation.genre
          ),

        typeIds:
          Array.isArray(video.type_ids)
            ? video.type_ids
            : video.type_id != null
              ? [video.type_id]
              : [],

        // Supabase의 snake_case 컬럼을 앱의 camelCase로 변환
        typeId:
          video.type_id ?? null,

        seriesId:
          video.series_id ?? null,
      }));

    setVideos(videosWithRelations);
    setLoading(false);
  }

  // =============================
  // 등장인물
  // =============================

  async function loadPeople() {
    const {
      data,
      error,
    } = await supabase
      .from("people")
      .select("*")
      .order("name");

    if (error) {
      console.error(
        "등장인물 불러오기 오류:",
        error
      );
      return;
    }

    setPeople(data ?? []);
  }

  // =============================
  // 장르
  // =============================

  async function loadGenres() {
    const {
      data,
      error,
    } = await supabase
      .from("genres")
      .select("*")
      .order("name");

    if (error) {
      console.error(
        "장르 불러오기 오류:",
        error
      );
      return;
    }

    setGenres(data ?? []);
  }

  // =============================
  // 타입
  // =============================

  async function loadTypes() {
    const {
      data,
      error,
    } = await supabase
      .from("types")
      .select("*")
      .order("name");

    if (error) {
      console.error(
        "타입 불러오기 오류:",
        error
      );
      return;
    }

    setTypes(data ?? []);
  }

  // =============================
  // 시리즈
  // =============================

  async function loadSeries() {
    const {
      data,
      error,
    } = await supabase
      .from("series")
      .select("*")
      .order("name");

    if (error) {
      console.error(
        "시리즈 불러오기 오류:",
        error
      );
      return;
    }

    setSeries(data ?? []);
  }

  // =============================
  // YouTube 가져오기
  // =============================

  async function importYouTubeVideos() {
    setImporting(true);
    setImportMessage("");

    try {
      const response =
        await fetch("/api/youtube");

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.details ||
            data.error ||
            "영상 가져오기에 실패했습니다."
        );
      }

      setImportMessage(
        `${data.count}개의 영상을 가져왔습니다.`
      );

      await loadVideos();
    } catch (error) {
      console.error(
        "영상 가져오기 오류:",
        error
      );

      setImportMessage(
        error instanceof Error
          ? error.message
          : "영상 가져오기에 실패했습니다."
      );
    } finally {
      setImporting(false);
    }
  }

  // =============================
  // 영상 편집 열기
  // =============================

  function openVideoEditor(video: Video) {
    if (typeof window !== "undefined") {
      videoEditorScrollYRef.current =
        document.scrollingElement?.scrollTop ??
        window.scrollY;
    }

    setEditingVideo(video);

    setEditorPeople(
      Array.isArray(video.peopleIds)
        ? video.peopleIds
        : []
    );

    setEditorGenres(
      Array.isArray(video.genreIds)
        ? video.genreIds
        : []
    );

    setEditorTypes(
      Array.isArray(video.typeIds)
        ? video.typeIds
        : video.typeId != null
          ? [video.typeId]
          : []
    );

    setEditorSeries(
      video.seriesId ?? null
    );
  }

  // =============================
  // 영상 편집 닫기
  // =============================

  function closeVideoEditor() {
    setEditingVideo(null);
    setEditorPeople([]);
    setEditorGenres([]);
    setEditorTypes([]);
    setEditorSeries(null);
  }

  // =============================
  // 영상 저장
  // =============================

  async function saveVideoRelations() {
    if (!editingVideo) return;

    if (typeof window !== "undefined") {
      videoEditorScrollYRef.current =
        window.scrollY;
    }

    setSavingVideo(true);

    try {
      // =============================
      // 등장인물 기존 연결 삭제
      // =============================

      const {
        error: peopleDeleteError,
      } = await supabase
        .from("video_people")
        .delete()
        .eq(
          "video",
          editingVideo.id
        );

      if (peopleDeleteError) {
        throw peopleDeleteError;
      }

      // =============================
      // 등장인물 저장
      // =============================

      if (editorPeople.length > 0) {
        const {
          error: peopleInsertError,
        } = await supabase
          .from("video_people")
          .insert(
            editorPeople.map(
              (personId) => ({
                video: editingVideo.id,
                person: personId,
              })
            )
          );

        if (peopleInsertError) {
          throw peopleInsertError;
        }
      }

      // =============================
      // 장르 기존 연결 삭제
      // =============================

      const {
        error: genreDeleteError,
      } = await supabase
        .from("video_genres")
        .delete()
        .eq(
          "video",
          editingVideo.id
        );

      if (genreDeleteError) {
        throw genreDeleteError;
      }

      // =============================
      // 장르 저장
      // =============================

      if (editorGenres.length > 0) {
        const {
          error: genreInsertError,
        } = await supabase
          .from("video_genres")
          .insert(
            editorGenres.map(
              (genreId) => ({
                video: editingVideo.id,
                genre: genreId,
              })
            )
          );

        if (genreInsertError) {
          throw genreInsertError;
        }
      }

      // =============================
      // 타입 / 시리즈 저장
      // =============================

      const {
        error: videoUpdateError,
      } = await supabase
        .from("videos")
        .update({
          type_ids: editorTypes,
          type_id: editorTypes[0] ?? null,
          series_id: editorSeries,
        })
        .eq(
          "id",
          editingVideo.id
        );

      if (videoUpdateError) {
        throw videoUpdateError;
      }

      // =============================
      // 새 데이터 다시 불러오기
      // =============================

      await loadVideos();

      closeVideoEditor();

      if (typeof window !== "undefined") {
        const restoreScroll = () => {
          const y = videoEditorScrollYRef.current;
          window.scrollTo({
            top: y,
            left: 0,
            behavior: "auto",
          });

          const scrollingElement = document.scrollingElement;
          if (scrollingElement) {
            scrollingElement.scrollTop = y;
          }
        };

        restoreScroll();

        requestAnimationFrame(() => {
          restoreScroll();
          requestAnimationFrame(() => {
            restoreScroll();
            window.setTimeout(restoreScroll, 100);
          });
        });
      }
    } catch (error) {
      console.error(
        "영상 정보 저장 오류:",
        error
      );

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(
          JSON.stringify(
            error,
            null,
            2
          )
        );
      }
    } finally {
      setSavingVideo(false);
    }
  }

  // =============================
  // 필터링
  // =============================

  const filteredVideos = useMemo(() => {
    let result = videos.filter(
      (video) => {
        // 제목
        const matchesSearch =
          video.title
            .toLowerCase()
            .includes(
              search.toLowerCase()
            );

        // 날짜
        const matchesDate =
          date === "" ||
          video.published_at.slice(
            0,
            10
          ) === date;

        // 등장인물
        const matchesPerson =
          selectedPeople.length === 0 ||
          (video.peopleIds ?? []).some((personId) =>
            selectedPeople.includes(personId)
          );

        // 장르
        const videoGenreIds =
          Array.isArray(
            video.genreIds
          )
            ? video.genreIds
            : [];

        const matchesGenre =
          selectedGenres.length === 0 ||
          selectedGenres.some(
            (genreId) =>
              videoGenreIds.includes(
                genreId
              )
          );

        // 콘텐츠 타입
        const videoTypeIds =
          Array.isArray(video.typeIds)
            ? video.typeIds
            : video.typeId != null
              ? [video.typeId]
              : [];

        const matchesType =
          selectedTypes.length === 0 ||
          selectedTypes.some((typeId) =>
            videoTypeIds.includes(typeId)
          );

        // 시리즈
        const matchesSeries =
          selectedSeries.length === 0 ||
          (video.seriesId != null &&
            selectedSeries.includes(video.seriesId));

        return (
          matchesSearch &&
          matchesDate &&
          matchesPerson &&
          matchesGenre &&
          matchesType &&
          matchesSeries
        );
      }
    );

    // =============================
    // 정렬
    // =============================

    result = [...result].sort(
      (a, b) => {
        if (sort === "최신순") {
          return b.published_at.localeCompare(
            a.published_at
          );
        }

        return a.published_at.localeCompare(
          b.published_at
        );
      }
    );

    return result;
  }, [
    videos,
    search,
    date,
    selectedPeople,
    selectedGenres,
    selectedTypes,
    selectedSeries,
    sort,
  ]);

  // =============================
  // 페이지네이션
  // =============================

  const totalPages = Math.ceil(
    filteredVideos.length /
      VIDEOS_PER_PAGE
  );

  const startIndex =
    (currentPage - 1) *
    VIDEOS_PER_PAGE;

  const paginatedVideos =
    filteredVideos.slice(
      startIndex,
      startIndex +
        VIDEOS_PER_PAGE
    );

  // =============================
  // 필터 초기화
  // =============================

  function resetFilters() {
    setSearch("");
    setDate("");
    setSelectedPeople([]);
    setSelectedGenres([]);
    setSelectedTypes([]);
    setSelectedSeries([]);
    setSort("최신순");
  }

  // =============================
  // 화면
  // =============================

  return (
    <>
      <main className="site-page min-h-screen bg-zinc-950 text-white">

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-20 sm:px-6 sm:py-10 sm:pb-16">

        {/* ========================= */}
        {/* 헤더 */}
        {/* ========================= */}

        <header className="mb-8">
          <p className="text-xs font-semibold tracking-[0.25em] text-zinc-600">
            SLEEPGROUND TV ARCHIVE
          </p>

          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                잠뜰TV Archive
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                잠뜰TV 영상을 검색하고
                정리해보세요.
              </p>
            </div>

            <button
              type="button"
              onClick={
                importYouTubeVideos
              }
              disabled={importing}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing
                ? "영상 가져오는 중..."
                : "YouTube 영상 가져오기"}
            </button>
          </div>

          {importMessage && (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
              {importMessage}
            </div>
          )}
        </header>

        {/* ========================= */}
        {/* 필터 */}
        {/* ========================= */}

        <VideoFilters
  search={search}
  date={date}
  selectedPeople={selectedPeople}
  selectedGenres={selectedGenres}
  selectedTypes={selectedTypes}
  selectedSeries={selectedSeries}
  sort={sort}
  people={people}
  genres={genres}
  types={types}
  series={series}
  setSearch={setSearch}
  setDate={setDate}
  setSelectedPeople={setSelectedPeople}
  setSelectedGenres={setSelectedGenres}
  setSelectedTypes={setSelectedTypes}
  setSelectedSeries={setSelectedSeries}
  setSort={setSort}
  onReset={resetFilters}
/>

        {/* ========================= */}
        {/* 결과 헤더 */}
        {/* ========================= */}

        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <div>
            <h2 className="font-semibold text-zinc-200">
              영상
            </h2>

            {selectedGenres.length >
              0 && (
              <p className="mt-1 text-xs text-zinc-600">
                장르{" "}
                {selectedGenres.length}개
                선택됨
              </p>
            )}
          </div>

          <span className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500">
            {filteredVideos.length}개
          </span>
        </div>

        {/* ========================= */}
        {/* 로딩 */}
        {/* ========================= */}

        {loading && (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 py-24 text-center">
            <p className="text-sm text-zinc-500">
              영상을 불러오는 중...
            </p>
          </div>
        )}

        {/* ========================= */}
        {/* 영상 없음 */}
        {/* ========================= */}

        {!loading &&
          filteredVideos.length ===
            0 && (
            <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30 py-24 text-center">
              <p className="text-sm text-zinc-500">
                해당 조건의 영상이
                없습니다.
              </p>

              <button
                type="button"
                onClick={
                  resetFilters
                }
                className="mt-4 rounded-xl bg-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
              >
                필터 초기화
              </button>
            </div>
          )}

        {/* ========================= */}
        {/* 영상 목록 */}
        {/* ========================= */}

        {!loading &&
          filteredVideos.length >
            0 && (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedVideos.map(
                  (video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      people={people}
                      genres={genres}
                      types={types}
                      series={series}
                      onEdit={
                        openVideoEditor
                      }
                    />
                  )
                )}
              </div>

              {totalPages > 1 && (
                  <nav
                    aria-label="영상 페이지 이동"
                    className="mt-8 flex w-full min-w-0 items-center justify-center overflow-hidden px-0 pb-2"
                  >
                    {/* 모바일: 다음 버튼까지 항상 한 줄 */}
                    <div className="flex w-full min-w-0 items-center justify-center gap-1 sm:hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((page) =>
                            Math.max(1, page - 1)
                          )
                        }
                        disabled={currentPage === 1}
                        className="h-10 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        이전
                      </button>

                      <div className="flex min-w-0 shrink items-center justify-center gap-1">
                        {[
                          currentPage - 1,
                          currentPage,
                          currentPage + 1,
                        ]
                          .filter(
                            (page) =>
                              page >= 1 &&
                              page <= totalPages
                          )
                          .map((page) => (
                            <button
                              key={`mobile-page-${page}`}
                              type="button"
                              onClick={() =>
                                setCurrentPage(page)
                              }
                              className={`h-10 min-w-9 shrink-0 rounded-xl px-2 text-sm font-medium transition ${
                                currentPage === page
                                  ? "bg-blue-600 text-white"
                                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((page) =>
                            Math.min(
                              totalPages,
                              page + 1
                            )
                          )
                        }
                        disabled={
                          currentPage === totalPages
                        }
                        className="h-10 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        다음
                      </button>
                    </div>

                    {/* PC: 기존 페이지네이션 */}
                    <div className="hidden items-center gap-2 sm:flex">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((page) =>
                            Math.max(1, page - 1)
                          )
                        }
                        disabled={currentPage === 1}
                        className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        이전
                      </button>

                      <div className="flex min-w-0 flex-wrap items-center justify-center gap-1">
                        {(() => {
                          const pages: (number | string)[] = [];

                          if (totalPages <= 7) {
                            for (
                              let page = 1;
                              page <= totalPages;
                              page++
                            ) {
                              pages.push(page);
                            }
                          } else {
                            pages.push(1);

                            if (currentPage > 4) {
                              pages.push("...");
                            }

                            const startPage = Math.max(
                              2,
                              currentPage - 1
                            );
                            const endPage = Math.min(
                              totalPages - 1,
                              currentPage + 1
                            );

                            for (
                              let page = startPage;
                              page <= endPage;
                              page++
                            ) {
                              pages.push(page);
                            }

                            if (
                              currentPage <
                              totalPages - 3
                            ) {
                              pages.push("...");
                            }

                            pages.push(totalPages);
                          }

                          return pages.map(
                            (page, index) =>
                              page === "..." ? (
                                <span
                                  key={`ellipsis-${index}`}
                                  className="px-2 text-sm text-zinc-600"
                                >
                                  ...
                                </span>
                              ) : (
                                <button
                                  key={page}
                                  type="button"
                                  onClick={() =>
                                    setCurrentPage(
                                      page as number
                                    )
                                  }
                                  className={`min-w-10 shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition ${
                                    currentPage === page
                                      ? "bg-blue-600 text-white"
                                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                  }`}
                                >
                                  {page}
                                </button>
                              )
                          );
                        })()}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((page) =>
                            Math.min(
                              totalPages,
                              page + 1
                            )
                          )
                        }
                        disabled={
                          currentPage === totalPages
                        }
                        className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        다음
                      </button>
                    </div>
                  </nav>
                )}

            </>
          )}
      </div>

      {/* ========================= */}
      {/* 영상 편집 */}
      {/* ========================= */}

      <footer className="site-footer border-t border-zinc-900 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-5 py-8 text-center sm:px-6">
          <p className="text-xs text-zinc-600">
            SLEEPGROUND TV ARCHIVE
          </p>
          <p className="mt-2 text-xs text-zinc-700">
            잠뜰TV Archive
          </p>
        </div>
      </footer>

      <VideoEditor
        video={editingVideo}
        people={people}
        genres={genres}
        types={types}
        series={series}
        selectedPeople={
          editorPeople
        }
        selectedGenres={
          editorGenres
        }
        selectedTypes={
          editorTypes
        }
        selectedSeries={
          editorSeries
        }
        saving={savingVideo}
        setSelectedPeople={
          setEditorPeople
        }
        setSelectedGenres={
          setEditorGenres
        }
        setSelectedTypes={
          setEditorTypes
        }
        setSelectedSeries={
          setEditorSeries
        }
        onSave={
          saveVideoRelations
        }
        onClose={
          closeVideoEditor
        }
      />
      </main>
    </>
  );
}