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
                  <p className="site-menu-eyebrow">MEUN</p>
                  <h2>메뉴</h2>
                </div>
                <button type="button" className="site-menu-close" onClick={closeMenu} aria-label="닫기">
                  ×
                </button>
              </div>

              <div className="site-menu-content">
                <section className="site-menu-section">
                  <p className="site-menu-label">ARCHIVE GUIDE</p>
                  <button
                    type="button"
                    className="site-menu-item"
                    onClick={() => {
                      setShowGuide(true);
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
              <p>잠뜰TV Archive에 등록된 영상을 검색하고 필터링할 수 있습니다.</p>
              <p>영상 카드를 누르면 YouTube 영상으로 이동합니다.</p>
              <p>멤버, 장르, 타입, 시리즈와 날짜 필터를 이용해 원하는 영상을 찾을 수 있습니다.</p>
              <p>관리 기능은 관리자 계정으로 로그인한 경우에만 표시됩니다.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
