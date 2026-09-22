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
      setGuideError("안내 내용을 불러오지 못했습니다.");
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
      setGuideError("안내 내용을 저장하지 못했습니다.");
      setGuideSaving(false);
      return;
    }

    setGuideText(guideDraft);
    setEditingGuide(false);
    setGuideSaving(false);
  }

  const openGuide = () => {
    setShowGuide(true);
    setEditingGuide(false);
    void loadGuide();
  };

  const closeMenu = () => setOpen(false);

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

    const { data: adminData, error: adminError } = await supabase.rpc("is_admin");

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
                    <span>처음으로 돌아가기</span>
                    <span>↑</span>
                  </button>
                </section>

                <section className="site-menu-section">
                  <p className="site-menu-label">ARCHIVE GUIDE</p>
                  <button
                    type="button"
                    className="site-menu-item site-menu-item-featured"
                    onClick={() => {
                      openGuide();
                      closeMenu();
                    }}
                  >
                    <span>안내</span>
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
                        <span>{importing ? "가져오는 중..." : "YouTube 영상 불러오기"}</span>
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
        <div className="site-menu-modal" role="dialog" aria-modal="true" aria-labelledby="admin-login-title">
          <div className="site-menu-modal-card">
            <div className="site-menu-modal-header">
              <div>
                <p className="site-menu-eyebrow">ADMIN</p>
                <h2 id="admin-login-title">관리자 로그인</h2>
              </div>
              <button type="button" className="site-menu-close" onClick={() => setShowLogin(false)} aria-label="닫기">
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
          <div className="site-menu-modal-card">
            <div className="site-menu-modal-header">
              <div>
                <p className="site-menu-eyebrow">ARCHIVE GUIDE</p>
                <h2 id="site-guide-title">안내</h2>
              </div>
              <button type="button" className="site-menu-close" onClick={() => setShowGuide(false)} aria-label="닫기">
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

                  {guideError && <p className="site-menu-error">{guideError}</p>}

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
                      style={{
                        width: "100%",
                        minHeight: "44px",
                        borderRadius: "12px",
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      className="site-menu-login-button"
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
                    <p>등록된 안내 내용이 없습니다.</p>
                  )}

                  {guideError && <p className="site-menu-error">{guideError}</p>}

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
                      안내 수정
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
