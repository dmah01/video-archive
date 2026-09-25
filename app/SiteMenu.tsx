"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { ThemePicker } from "./ThemeSettings";

type SiteMenuProps = {
  isAdmin: boolean;
  onAdminChange: (value: boolean) => void;
  importing: boolean;
  onImportYouTubeVideos: () => void;
  onOpenYouTubeAdd: () => void;
};

export default function SiteMenu({
  isAdmin,
  onAdminChange,
  importing,
  onImportYouTubeVideos,
  onOpenYouTubeAdd,
}: SiteMenuProps) {
  const [open, setOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showGuide2, setShowGuide2] = useState(false);
  const [editingGuide2, setEditingGuide2] = useState(false);
  const [guide2Text, setGuide2Text] = useState("");
  const [guide2Draft, setGuide2Draft] = useState("");
  const [guide2Pages, setGuide2Pages] = useState<{ title: string; content: string }[]>([]);
  const [guide2Page, setGuide2Page] = useState(0);
  const [guide2Loading, setGuide2Loading] = useState(false);
  const [guide2Saving, setGuide2Saving] = useState(false);
  const [guide2Error, setGuide2Error] = useState("");

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackConfirm, setFeedbackConfirm] = useState(false);

  const [editingGuide, setEditingGuide] = useState(false);
  const [guideText, setGuideText] = useState("");
  const [guideDraft, setGuideDraft] = useState("");
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideSaving, setGuideSaving] = useState(false);
  const [guideError, setGuideError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  async function checkAdmin() {
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      onAdminChange(false);
      return;
    }

    const { data, error } = await supabase.rpc("is_admin");

    if (error || data !== true) {
      onAdminChange(false);
      return;
    }

    onAdminChange(true);
  }

  useEffect(() => {
    void checkAdmin();

    const { data } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => {
        void checkAdmin();
      }, 0);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  async function loadGuide() {
    setGuideLoading(true);
    setGuideError("");

    const { data, error } = await supabase
      .from("site_settings")
      .select("content")
      .eq("id", "archive_guide")
      .maybeSingle();

    if (error) {
      setGuideError("내용을 불러오지 못했습니다.");
      setGuideLoading(false);
      return;
    }

    const content = data?.content ?? "";
    setGuideText(content);
    setGuideDraft(content);
    setGuideLoading(false);
  }

  async function saveGuide() {
    if (!isAdmin || guideSaving) return;

    setGuideSaving(true);
    setGuideError("");

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      setGuideError("관리자 로그인이 필요합니다.");
      setGuideSaving(false);
      return;
    }

    const { error } = await supabase
      .from("site_settings")
      .upsert(
        {
          id: "archive_guide",
          content: guideDraft,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      setGuideError("내용을 저장하지 못했습니다.");
      setGuideSaving(false);
      return;
    }

    setGuideText(guideDraft);
    setEditingGuide(false);
    setGuideSaving(false);
  }

  async function loadGuide2() {
    setGuide2Loading(true);
    setGuide2Error("");

    const { data, error } = await supabase
      .from("site_settings")
      .select("content")
      .eq("id", "archive_guide_2")
      .maybeSingle();

    if (error) {
      setGuide2Error("내용을 불러오지 못했습니다.");
      setGuide2Loading(false);
      return;
    }

    const rawContent = data?.content ?? "";
    try {
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed) && parsed.every((item) => item && typeof item.title === "string" && typeof item.content === "string")) {
        const pages = parsed.length > 0 ? parsed : [{ title: "검색 및 분류 안내", content: "" }];
        setGuide2Pages(pages);
        setGuide2Page(0);
        setGuide2Text(pages[0].content);
        setGuide2Draft(pages[0].content);
      } else {
        throw new Error("legacy");
      }
    } catch {
      const pages = [
        { title: "분류 기준 및 유의사항", content: rawContent },
        { title: "멤버 검색 및 분류", content: "" },
        { title: "장르 검색 및 분류", content: "" },
        { title: "타입 분류", content: "" },
        { title: "시리즈 분류", content: "" },
      ];
      setGuide2Pages(pages);
      setGuide2Page(0);
      setGuide2Text(pages[0].content);
      setGuide2Draft(pages[0].content);
    }
    setGuide2Loading(false);
  }

  async function saveGuide2() {
    if (!isAdmin || guide2Saving) return;

    setGuide2Saving(true);
    setGuide2Error("");

    const { error } = await supabase
      .from("site_settings")
      .upsert(
        {
          id: "archive_guide_2",
          content: JSON.stringify(
            guide2Pages.map((page, index) =>
              index === guide2Page ? { ...page, content: guide2Draft } : page
            )
          ),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      setGuide2Error("내용을 저장하지 못했습니다.");
      setGuide2Saving(false);
      return;
    }

    const updatedPages = guide2Pages.map((page, index) =>
      index === guide2Page ? { ...page, content: guide2Draft } : page
    );
    setGuide2Pages(updatedPages);
    setGuide2Text(guide2Draft);
    setEditingGuide2(false);
    setGuide2Saving(false);
  }

  const openGuide2 = () => {
    setShowGuide2(true);
    setEditingGuide2(false);
    setGuide2Page(0);
    void loadGuide2();
  };

  const openGuide = () => {
    setShowGuide(true);
    setEditingGuide(false);
    void loadGuide();
  };

  const closeMenu = () => setOpen(false);

  const openFeedback = () => {
    setFeedbackText("");
    setFeedbackError("");
    setFeedbackSent(false);
    setFeedbackConfirm(false);
    setFeedbackOpen(true);
    setOpen(false);
  };

  const closeFeedback = () => {
    if (feedbackLoading) return;
    setFeedbackOpen(false);
    setFeedbackText("");
    setFeedbackError("");
    setFeedbackSent(false);
    setFeedbackConfirm(false);
  };

  async function submitFeedback() {
    const content = feedbackText.trim();

    if (!content || feedbackLoading) return;

    setFeedbackLoading(true);
    setFeedbackError("");
    setFeedbackSent(false);
    setFeedbackConfirm(false);

    const { error } = await supabase.from("site_feedback").insert({
      content,
    });

    if (error) {
      setFeedbackError("의견을 보내지 못했습니다. 잠시 후 다시 시도해주세요.");
      setFeedbackLoading(false);
      return;
    }

    setFeedbackSent(true);
    setFeedbackText("");
    setFeedbackLoading(false);
  }

  const openLogin = () => {
    setLoginError("");
    setPassword("");
    setShowLogin(true);
  };

  async function handleLogin() {
    if (!email.trim() || !password || loginLoading) return;

    setLoginLoading(true);
    setLoginError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoginError(error.message);
      setLoginLoading(false);
      return;
    }

    const { data: adminData, error: adminError } =
      await supabase.rpc("is_admin");

    if (adminError || adminData !== true) {
      await supabase.auth.signOut();
      onAdminChange(false);
      setLoginError("관리자 권한이 없는 계정입니다.");
      setLoginLoading(false);
      return;
    }

    onAdminChange(true);
    setShowLogin(false);
    setOpen(false);
    setPassword("");
    setLoginLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    onAdminChange(false);
    setOpen(false);
  }

  const selectGuide2Page = (index: number) => {
    if (editingGuide2) return;
    const page = guide2Pages[index];
    if (!page) return;
    setGuide2Page(index);
    setGuide2Text(page.content);
    setGuide2Draft(page.content);
    setGuide2Error("");
  };

  return (
    <>
      <div className="site-menu-root">
        <button
          type="button"
          className={`site-menu-button ${open ? "is-open" : ""}`}
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>

        {open && (
          <>
            <button
              type="button"
              className="site-menu-overlay"
              aria-label="메뉴 닫기"
              onClick={closeMenu}
            />

            <aside className="site-menu-panel" aria-label="사이트 메뉴">
              <div className="site-menu-header">
                <div>
                  <p className="site-menu-eyebrow">MENU</p>
                  <h2>메뉴</h2>
                </div>
              </div>

              <div className="site-menu-content">
                <section className="site-menu-section">
                  <p className="site-menu-label">RETURN</p>
                  <button
                    type="button"
                    className="site-menu-item site-menu-item-featured"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      closeMenu();
                    }}
                  >
                    <span>맨 위로</span>
                    <span>↑</span>
                  </button>
                </section>

                <section className="site-menu-section">
                  <p className="site-menu-label">GUIDE</p>
                  <div className="site-menu-admin-list flex flex-col gap-2.5">
                    <button
                      type="button"
                      className="site-menu-item site-menu-item-featured"
                      style={{ minHeight: "44px" }}
                      onClick={() => {
                        openGuide();
                        closeMenu();
                      }}
                    >
                      <span>기본 안내</span>
                      <span>›</span>
                    </button>

                    <button
                      type="button"
                      className="site-menu-item site-menu-item-featured"
                      style={{ minHeight: "44px" }}
                      onClick={() => {
                        openGuide2();
                        closeMenu();
                      }}
                    >
                      <span>검색 및 분류 안내</span>
                      <span>›</span>
                    </button>
                  </div>
                </section>

                <section className="site-menu-section">
                  <p className="site-menu-label">FEEDBACK</p>
                
                  <button
                    type="button"
                    className="site-menu-item site-menu-item-featured"
                    onClick={openFeedback}
                  >
                    <span>의견 보내기</span>
                    <span>›</span>
                  </button>
                </section>

                <section className="site-menu-section">
                  <p className="site-menu-label">THEMES</p>
                  <ThemePicker compact />
                </section>

                <section className="site-menu-section">
                  <p className="site-menu-label">MANAGER</p>

                  {!isAdmin ? (
                    <div className="site-menu-admin-list flex flex-col gap-2.5">
                      <button
                        type="button"
                        className="site-menu-item"
                        onClick={() => {
                          openLogin();
                          closeMenu();
                        }}
                      >
                        <span>관리자 로그인</span>
                        <span>›</span>
                      </button>
                    </div>
                  ) : (
                    <div className="site-menu-admin-list flex flex-col gap-2.5">
                      <button
                        type="button"
                        className="site-menu-item site-menu-item-admin"
                        onClick={() => {
                          closeMenu();
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <span>영상 관리</span>
                        <span>✓</span>
                      </button>

                      <button
                        type="button"
                        className="site-menu-item site-menu-item-admin"
                        disabled={importing}
                        onClick={() => {
                          onOpenYouTubeAdd();
                          closeMenu();
                        }}
                      >
                        <span>YouTube 영상 추가</span>
                        <span>+</span>
                      </button>

                      <button
                        type="button"
                        className="site-menu-item site-menu-item-admin"
                        disabled={importing}
                        onClick={() => {
                          onImportYouTubeVideos();
                          closeMenu();
                        }}
                      >
                        <span>
                          {importing
                            ? "가져오는 중..."
                            : "YouTube 영상 불러오기"}
                        </span>
                        <span>↻</span>
                      </button>

                      <button
                        type="button"
                        className="site-menu-item site-menu-item-danger"
                        onClick={() => void handleLogout()}
                      >
                        <span>로그아웃</span>
                      </button>
                    </div>
                  )}
                </section>
              </div>
            </aside>
          </>
        )}
      </div>

      {showLogin && (
        <div
          className="site-menu-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-login-title"
        >
          <div className="site-menu-modal-card">
            <div className="site-menu-modal-header">
              <div>
                <p className="site-menu-eyebrow">ADMIN</p>
                <h2 id="admin-login-title">관리자 로그인</h2>
              </div>
              <button
                type="button"
                className="site-menu-close"
                onClick={() => setShowLogin(false)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <div className="site-menu-form">
              <label>
                <span>이메일</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  autoFocus
                  placeholder="관리자 이메일"
                  style={{ fontSize: "16px" }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleLogin();
                  }}
                />
              </label>

              <label>
                <span>비밀번호</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="비밀번호"
                  style={{ fontSize: "16px" }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleLogin();
                  }}
                />
              </label>

              {loginError && <p className="site-menu-error">{loginError}</p>}

              <button
                type="button"
                className="site-menu-login-button"
                onClick={() => void handleLogin()}
                disabled={loginLoading || !email.trim() || !password}
              >
                {loginLoading ? "확인 중..." : "로그인"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGuide && (
        <div
          className="site-menu-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="site-guide-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowGuide(false);
          }}
        >
          <div
            className="site-menu-modal-card"
            style={{ width: "min(700px, calc(100vw - 24px))" }}
          >
            <div className="site-menu-modal-header">
              <div>
                <p className="site-menu-eyebrow">GUIDE</p>
                <h2 id="site-guide-title">기본 안내</h2>
              </div>
              <button
                type="button"
                className="site-menu-close"
                onClick={() => setShowGuide(false)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <div className="site-guide-body">
              {guideLoading ? (
                <p>불러오는 중...</p>
              ) : editingGuide && isAdmin ? (
                <>
                  <textarea
                    value={guideDraft}
                    onChange={(event) => setGuideDraft(event.target.value)}
                    rows={10}
                    className="site-guide-editor"
                    placeholder="사이트 안내 내용을 입력하세요."
                  />

                  {guideError && (
                    <p className="site-menu-error">{guideError}</p>
                  )}

                  <div
                    className="site-guide-actions"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      width: "100%",
                      marginTop: "16px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setGuideDraft(guideText);
                        setEditingGuide(false);
                        setGuideError("");
                      }}
                      disabled={guideSaving}
                      className="site-menu-login-button"
                    >
                      취소
                    </button>

                    <button
                      type="button"
                      onClick={() => void saveGuide()}
                      disabled={guideSaving}
                      className="site-menu-login-button"
                      style={{
                        width: "100%",
                        minHeight: "44px",
                        borderRadius: "12px",
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {guideSaving ? "저장 중..." : "저장"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {guideText ? (
                    <div className="whitespace-pre-wrap">{guideText}</div>
                  ) : (
                    <p>등록된 내용이 없습니다.</p>
                  )}

                  {guideError && (
                    <p className="site-menu-error">{guideError}</p>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      className="site-menu-login-button mt-4 w-full"
                      onClick={() => {
                        setGuideDraft(guideText);
                        setGuideError("");
                        setEditingGuide(true);
                      }}
                    >
                      수정
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showGuide2 && (
        <div
          className="site-menu-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="site-guide2-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowGuide2(false);
          }}
        >
          <div
            className="site-menu-modal-card"
            style={{ width: "min(700px, calc(100vw - 24px))" }}
          >
            <div className="site-menu-modal-header">
              <div>
                <p className="site-menu-eyebrow">GUIDE</p>
                <h2 id="site-guide2-title">검색 및 분류 안내</h2>
              </div>
              <button
                type="button"
                className="site-menu-close"
                onClick={() => setShowGuide2(false)}
                aria-label="닫기"
                disabled={guide2Saving}
              >
                ×
              </button>
            </div>

            <div className="site-guide-body">
              {!guide2Loading && guide2Pages.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "16px",
                  }}
                >
                  {guide2Pages.map((page, index) => (
                    <button
                      key={`${page.title}-${index}`}
                      type="button"
                      onClick={() => selectGuide2Page(index)}
                      disabled={editingGuide2}
                      style={{
                        minHeight: "38px",
                        padding: "8px 13px",
                        borderRadius: "10px",
                        border: index === guide2Page ? "1px solid #71717a" : "1px solid #27272a",
                        background: index === guide2Page ? "#27272a" : "transparent",
                        color: index === guide2Page ? "#f4f4f5" : "#a1a1aa",
                        fontSize: "12px",
                        cursor: editingGuide2 ? "not-allowed" : "pointer",
                      }}
                    >
                      {page.title}
                    </button>
                  ))}
                </div>
              )}
              {guide2Loading ? (
                <p>불러오는 중...</p>
              ) : editingGuide2 && isAdmin ? (
                <>
                  <textarea
                    value={guide2Draft}
                    onChange={(event) => setGuide2Draft(event.target.value)}
                    rows={10}
                    className="site-guide-editor"
                    placeholder="내용을 입력하세요."
                  />

                  {guide2Error && (
                    <p className="site-menu-error">{guide2Error}</p>
                  )}

                  <div
                    className="site-guide-actions"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      width: "100%",
                      marginTop: "16px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setGuide2Draft(guide2Text);
                        setEditingGuide2(false);
                        setGuide2Error("");
                      }}
                      disabled={guide2Saving}
                      className="site-menu-login-button"
                    >
                      취소
                    </button>

                    <button
                      type="button"
                      onClick={() => void saveGuide2()}
                      disabled={guide2Saving}
                      className="site-menu-login-button"
                    >
                      {guide2Saving ? "저장 중..." : "저장"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {guide2Text ? (
                    <div className="whitespace-pre-wrap">{guide2Text}</div>
                  ) : (
                    <p>등록된 내용이 없습니다.</p>
                  )}

                  {guide2Error && (
                    <p className="site-menu-error">{guide2Error}</p>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      className="site-menu-login-button mt-4 w-full"
                      onClick={() => {
                        setGuide2Draft(guide2Text);
                        setGuide2Error("");
                        setEditingGuide2(true);
                      }}
                    >
                      수정
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {feedbackOpen && (
        <div
          className="site-menu-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="site-feedback-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeFeedback();
          }}
        >
          <div
            className="site-menu-modal-card"
            style={{ width: "min(700px, calc(100vw - 24px))" }}
          >
            <div className="site-menu-modal-header">
              <div>
                <p className="site-menu-eyebrow">FEEDBACK</p>
                <h2 id="site-feedback-title">의견 보내기</h2>
                <p
                  className="site-menu-description site-menu-description-modal site-feedback-description"
                  style={{ fontSize: "12px", lineHeight: 1.5 }}
                >
                  별도의 답변은 드리지 않으며, 의견은 최대한 빠르게 반영하겠습니다.
                </p>
              </div>

              <button
                type="button"
                className="site-menu-close"
                onClick={closeFeedback}
                aria-label="닫기"
                disabled={feedbackLoading}
              >
                ×
              </button>
            </div>

            <div className="site-menu-form">
              {feedbackSent ? (
                <div className="site-guide-body">
                  <p>의견이 정상적으로 전달되었습니다.</p>
                  <button
                    type="button"
                    className="site-menu-login-button mt-4 w-full"
                    onClick={closeFeedback}
                  >
                    닫기
                  </button>
                </div>
              ) : (
                <>
                  <label>
                    <span>의견 작성</span>
                    <textarea
                      className="site-feedback-textarea"
                      value={feedbackText}
                      onChange={(event) => setFeedbackText(event.target.value)}
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                      rows={8}
                      maxLength={2000}
                      autoFocus
                      placeholder="의견을 작성해주세요"
                      style={{
                        display: "block",
                        width: "100%",
                        minHeight: "180px",
                        resize: "vertical",
                        border: "1px solid #27272a",
                        borderRadius: "13px",
                        outline: "none",
                        background: "#18181b",
                        color: "#f4f4f5",
                        padding: "13px",
                        fontSize: "16px",
                        lineHeight: 1.6,
                        pointerEvents: "auto",
                        WebkitUserSelect: "text",
                        userSelect: "text",
                      }}
                    />
                  </label>

                  <p className="text-right text-[10px] text-zinc-600">
                    {feedbackText.length}/2000
                  </p>

                  {feedbackError && (
                    <p className="site-menu-error">{feedbackError}</p>
                  )}

                  {feedbackConfirm ? (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "14px",
                        borderRadius: "13px",
                        border: "1px solid #27272a",
                        background: "#18181b",
                      }}
                    >
                      <p className="text-sm text-zinc-200">작성한 의견을 보내시겠습니까?</p>
                      <p className="mt-1 text-xs text-zinc-500">보내기를 누르면 의견이 저장됩니다.</p>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "10px",
                          marginTop: "12px",
                        }}
                      >
                        <button
                          type="button"
                          className="site-menu-login-button"
                          onClick={() => setFeedbackConfirm(false)}
                          disabled={feedbackLoading}
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          className="site-menu-login-button"
                          onClick={() => void submitFeedback()}
                          disabled={feedbackLoading}
                        >
                          {feedbackLoading ? "보내는 중..." : "보내기"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="site-menu-login-button"
                      onClick={() => setFeedbackConfirm(true)}
                      disabled={feedbackLoading || !feedbackText.trim()}
                    >
                      의견 보내기
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
