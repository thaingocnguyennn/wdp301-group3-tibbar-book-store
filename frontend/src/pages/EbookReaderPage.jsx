import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { bookApi } from "../api/bookApi";

const THEME = {
  bg: "#020617",
  panel: "#0f172a",
  surface: "#111827",
  text: "#e5eef8",
  muted: "#94a3b8",
  border: "rgba(148,163,184,0.18)",
  accent: "#8b5cf6",
};

const READER_THEMES = {
  dark: THEME,
  light: {
    bg: "#f8fafc",
    panel: "#ffffff",
    surface: "#eef2f7",
    text: "#0f172a",
    muted: "#64748b",
    border: "rgba(15,23,42,0.12)",
    accent: "#7c3aed",
  },
  sepia: {
    bg: "#f4ead8",
    panel: "#fbf3e3",
    surface: "#efdfc2",
    text: "#3f2f22",
    muted: "#7a6753",
    border: "rgba(99,69,41,0.18)",
    accent: "#b45309",
  },
};

const THEME_OPTIONS = ["light", "dark", "sepia"];

const sessionKey = (id) => `ebook-reader-distraction:${id}`;

const EbookReaderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const shellRef = useRef(null);
  const iframeRef = useRef(null);
  const noteInputRef = useRef(null);
  const blobUrlRef = useRef(null);
  const currentPageRef = useRef(1);
  const totalPagesRef = useRef(0);
  const progressTimerRef = useRef(null);
  const noticeTimerRef = useRef(null);
  const viewerSyncTimerRef = useRef(null);
  const pendingViewerPageRef = useRef(null);
  const lastPersistedPageRef = useRef(null);
  const hydratingRef = useRef(true);

  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [error, setError] = useState("");
  const [blobUrl, setBlobUrl] = useState(null);
  const [book, setBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewerPage, setViewerPage] = useState(1);
  const [readerTheme, setReaderTheme] = useState("dark");
  const [notes, setNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState("");
  const [notePageInput, setNotePageInput] = useState("1");
  const [noteDraft, setNoteDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [notesOpen, setNotesOpen] = useState(true);
  const [isDistractionFree, setIsDistractionFree] = useState(() => {
    try {
      return sessionStorage.getItem(sessionKey(id)) === "true";
    } catch {
      return false;
    }
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const theme = READER_THEMES[readerTheme] || READER_THEMES.dark;
  const totalPages = Number(book?.totalPages || 0);
  const viewerSrc = blobUrl ? `${blobUrl}#page=${viewerPage}` : null;

  const showNotice = (message) => {
    setNotice(message);
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => setNotice(""), 2200);
  };

  const getCurrentViewerPage = () => {
    try {
      const iframeWindow = iframeRef.current?.contentWindow;
      const iframeHref = iframeWindow?.location?.href || "";
      const pageMatch = iframeHref.match(/[?#&]page=(\d+)/i);
      const rawNextPage = Number(pageMatch?.[1]);
      const safeTotalPages = Number(totalPagesRef.current || 0);

      if (!Number.isFinite(rawNextPage) || rawNextPage < 1) {
        return null;
      }

      return safeTotalPages > 0 ? Math.min(rawNextPage, safeTotalPages) : rawNextPage;
    } catch {
      return null;
    }
  };

  const markPendingViewerPage = (page) => {
    pendingViewerPageRef.current = {
      page,
      stabilizeUntil: Date.now() + 3000,
    };
  };

  const resolveLiveReaderPage = () => {
    const livePage = getCurrentViewerPage();
    if (livePage) {
      return livePage;
    }

    const fallbackPage = Number(currentPageRef.current || 1);
    return Number.isFinite(fallbackPage) && fallbackPage > 0 ? fallbackPage : 1;
  };

  const syncCurrentPageFromViewer = () => {
    try {
      const nextPage = getCurrentViewerPage();
      if (!nextPage) return;

      const pendingViewerPage = pendingViewerPageRef.current;
      if (pendingViewerPage?.page) {
        if (nextPage === pendingViewerPage.page) {
          pendingViewerPageRef.current = null;
        } else if (Date.now() < pendingViewerPage.stabilizeUntil) {
          return;
        } else {
          pendingViewerPageRef.current = null;
        }
      }

      if (nextPage !== currentPageRef.current) {
        setCurrentPage(nextPage);
      }
    } catch {
      // Native PDF viewers may block page introspection in some browsers.
    }
  };

  const applyReaderState = (payload = {}) => {
    const nextBook = payload.book || null;
    const nextState = payload.readerState || {};
    const nextPage = Number(nextState.progress?.currentPage || 1);
    const nextTheme = THEME_OPTIONS.includes(nextState.settings?.theme)
      ? nextState.settings.theme
      : "dark";

    setBook(nextBook);
    setReaderTheme(nextTheme);
    setNotes(Array.isArray(nextState.annotations) ? nextState.annotations : []);
    setCurrentPage(nextPage);
    setViewerPage(nextPage);
    setNotePageInput(String(nextPage));
    currentPageRef.current = nextPage;
    lastPersistedPageRef.current = nextPage;
    markPendingViewerPage(nextPage);
  };

  const persistProgress = async (page, { keepalive = false, force = false } = {}) => {
    const normalizedPage = Number(page || 1);
    if (!Number.isFinite(normalizedPage) || normalizedPage < 1) {
      return null;
    }

    if (!force && lastPersistedPageRef.current === normalizedPage) {
      return null;
    }

    if (keepalive) {
      const token = localStorage.getItem("accessToken");
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiBase}/books/${id}/reader-state/progress`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPage: normalizedPage }),
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error("Failed to save progress.");
      }

      const result = await response.json().catch(() => null);
      const nextProgress = result?.data?.readerState?.progress;
      if (nextProgress) {
        lastPersistedPageRef.current = Number(nextProgress.currentPage || normalizedPage);
      }
    } else {
      const response = await bookApi.saveEbookReaderProgress(id, {
        currentPage: normalizedPage,
      });
      const nextProgress = response.data?.readerState?.progress;
      if (nextProgress) {
        lastPersistedPageRef.current = Number(nextProgress.currentPage || normalizedPage);
      }
    }

    lastPersistedPageRef.current = normalizedPage;
    return normalizedPage;
  };

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    totalPagesRef.current = totalPages;
  }, [totalPages]);

  useEffect(() => {
    let cancelled = false;

    const loadReader = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await bookApi.getEbookReaderState(id);
        if (cancelled) return;
        applyReaderState(response.data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Failed to load reader.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          hydratingRef.current = false;
        }
      }
    };

    loadReader();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      try {
        setPdfLoading(true);
        const token = localStorage.getItem("accessToken");
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${apiBase}/books/${id}/ebook`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(
            response.status === 403
              ? "Please complete payment to read this e-book."
              : response.status === 404
                ? "E-book file not found."
                : "Failed to load e-book.",
          );
        }

        const blob = await response.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setPdfLoading(false);
        }
      }
    };

    loadPdf();
    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    const onFullscreenChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsDistractionFree(false);
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", onKeyDown);
      if (progressTimerRef.current) {
        window.clearTimeout(progressTimerRef.current);
      }
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
      if (viewerSyncTimerRef.current) {
        window.clearInterval(viewerSyncTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(sessionKey(id), isDistractionFree ? "true" : "false");
    } catch {
      // noop
    }
  }, [id, isDistractionFree]);

  useEffect(() => {
    if (hydratingRef.current) return;
    if (progressTimerRef.current) {
      window.clearTimeout(progressTimerRef.current);
    }
    progressTimerRef.current = window.setTimeout(() => {
      persistProgress(currentPage).catch(() => {});
    }, 700);
  }, [id, currentPage]);

  useEffect(() => {
    const flushProgress = () => {
      if (hydratingRef.current) return;
      const livePage = resolveLiveReaderPage();
      persistProgress(livePage, { keepalive: true, force: true }).catch(() => {});
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        flushProgress();
      }
    };

    window.addEventListener("beforeunload", flushProgress);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", flushProgress);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [id, currentPage]);

  useEffect(() => {
    return () => {
      if (hydratingRef.current) {
        return;
      }

      const livePage = resolveLiveReaderPage();
      const token = localStorage.getItem("accessToken");
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      fetch(`${apiBase}/books/${id}/reader-state/progress`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPage: livePage }),
        keepalive: true,
      }).catch(() => {});
    };
  }, [id]);

  useEffect(() => {
    if (!viewerSrc) return;

    if (viewerSyncTimerRef.current) {
      window.clearInterval(viewerSyncTimerRef.current);
    }

    viewerSyncTimerRef.current = window.setInterval(() => {
      syncCurrentPageFromViewer();
    }, 250);

    return () => {
      if (viewerSyncTimerRef.current) {
        window.clearInterval(viewerSyncTimerRef.current);
        viewerSyncTimerRef.current = null;
      }
    };
  }, [viewerSrc, currentPage, totalPages]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await shellRef.current?.requestFullscreen?.();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      showNotice("Fullscreen is not available.");
    }
  };

  const handleThemeChange = async (nextTheme) => {
    if (!THEME_OPTIONS.includes(nextTheme) || nextTheme === readerTheme) {
      return;
    }

    const previousTheme = readerTheme;
    setReaderTheme(nextTheme);

    try {
      await bookApi.saveEbookReaderSettings(id, { theme: nextTheme });
    } catch (err) {
      setReaderTheme(previousTheme);
      showNotice(err.response?.data?.message || "Failed to save theme.");
    }
  };

  const resetNoteComposer = (page = currentPageRef.current || 1) => {
    setEditingNoteId("");
    setNotePageInput(String(page));
    setNoteDraft("");
  };

  const jumpToPage = (page) => {
    const nextPage = Number(page);
    if (!Number.isFinite(nextPage) || nextPage < 1) {
      return;
    }

    const clampedPage = totalPages > 0 ? Math.min(nextPage, totalPages) : nextPage;
    markPendingViewerPage(clampedPage);
    setCurrentPage(clampedPage);
    setViewerPage(clampedPage);
  };

  const handleBackToBook = async () => {
    const livePage = resolveLiveReaderPage();
    await persistProgress(livePage, { keepalive: true, force: true }).catch(() => {});
    navigate(`/books/${id}`);
  };

  const saveNote = async () => {
    const trimmedNote = String(noteDraft || "").trim();
    if (!trimmedNote) {
      showNotice("Enter a note before saving.");
      return;
    }

    try {
      const rawTargetPage = Number(notePageInput || currentPage);
      if (!Number.isFinite(rawTargetPage) || rawTargetPage < 1) {
        showNotice("Enter a valid page number.");
        return;
      }

      const targetPage =
        totalPages > 0
          ? Math.min(Math.max(rawTargetPage, 1), totalPages)
          : Math.max(rawTargetPage, 1);

      if (targetPage !== currentPage) {
        jumpToPage(targetPage);
      }

      const currentEditingNote = notes.find((note) => note._id === editingNoteId);
      const payload = {
        page: targetPage,
        snippet: String(currentEditingNote?.snippet || `Note on page ${targetPage}`),
        note: trimmedNote,
      };
      const response = editingNoteId
        ? await bookApi.updateEbookAnnotation(id, editingNoteId, payload)
        : await bookApi.addEbookAnnotation(id, payload);

      setNotes(response.data?.readerState?.annotations || []);
      resetNoteComposer(targetPage);
      showNotice(
        editingNoteId
          ? `Updated note for page ${targetPage}.`
          : `Saved note for page ${targetPage}.`,
      );
    } catch (err) {
      showNotice(err.response?.data?.message || "Failed to save note.");
    }
  };

  const deleteNote = async (annotationId) => {
    try {
      const response = await bookApi.deleteEbookAnnotation(id, annotationId);
      setNotes(response.data?.readerState?.annotations || []);
      if (annotationId === editingNoteId) {
        resetNoteComposer();
      }
    } catch (err) {
      showNotice(err.response?.data?.message || "Failed to delete note.");
    }
  };

  const openNote = (page) => {
    setNotePageInput(String(page));
    jumpToPage(page);
  };

  const editNote = (note) => {
    setEditingNoteId(note._id);
    setNotesOpen(true);
    setNotePageInput(String(note.page));
    setNoteDraft(note.note || "");
    jumpToPage(note.page);
    window.setTimeout(() => {
      noteInputRef.current?.focus();
    }, 0);
  };

  if (loading) {
    return (
      <div
        style={{
          ...styles.state,
          backgroundColor: theme.bg,
          color: theme.text,
        }}
      >
        <div style={styles.spinner} />
        <p>Loading reader...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.state, backgroundColor: theme.bg }}>
        <div style={styles.errorCard}>
          <h2 style={styles.errorTitle}>Reader unavailable</h2>
          <p style={styles.errorText}>{error}</p>
          <div style={styles.row}>
            <button
              type="button"
              style={styles.primaryBtn}
              onClick={() => navigate(`/books/${id}`)}
            >
              Back to Book
            </button>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => navigate("/ebooks")}
            >
              My E-Books
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={shellRef}
      style={{
        ...styles.shell,
        backgroundColor: theme.bg,
        color: theme.text,
      }}
    >
      {notice && (
        <div
          style={{
            ...styles.notice,
            backgroundColor: theme.panel,
            borderColor: theme.border,
            color: theme.text,
          }}
        >
          {notice}
        </div>
      )}

      {!isDistractionFree && (
        <header
          style={{
            ...styles.header,
            backgroundColor: theme.bg,
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <div style={styles.headerIdentity}>
            <button
              type="button"
              style={{
                ...styles.headerBtn,
                color: theme.text,
                borderColor: theme.border,
              }}
              onClick={handleBackToBook}
            >
              Back
            </button>
            <div style={styles.headerCopy}>
              <h1 style={styles.heading}>{book?.title || "E-Book Reader"}</h1>
              <div style={styles.metaRow}>
                <span style={{ color: theme.muted }}>
                  {book?.author || "Unknown author"}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.row}>
            <div
              style={{
                ...styles.themeSwitch,
                borderColor: theme.border,
                backgroundColor: theme.panel,
              }}
            >
              {THEME_OPTIONS.map((option) => {
                const isActive = option === readerTheme;

                return (
                  <button
                    key={option}
                    type="button"
                    style={{
                      ...styles.themeOptionBtn,
                      color: isActive ? "#ffffff" : theme.text,
                      backgroundColor: isActive ? theme.accent : "transparent",
                    }}
                    onClick={() => handleThemeChange(option)}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              style={{
                ...styles.headerBtn,
                color: theme.text,
                borderColor: theme.border,
              }}
              onClick={() => navigate("/ebooks")}
            >
              My E-Books
            </button>
            <button
              type="button"
              style={{
                ...styles.headerBtn,
                color: theme.text,
                borderColor: theme.border,
              }}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
            <button
              type="button"
              style={{
                ...styles.primaryBtn,
                backgroundColor: theme.accent,
              }}
              onClick={() => setIsDistractionFree(true)}
            >
              Focus Mode
            </button>
          </div>
        </header>
      )}

      <main style={styles.stage}>
        {isDistractionFree && (
          <div style={styles.focusBar}>
            <button
              type="button"
              style={{
                ...styles.headerBtn,
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.panel,
              }}
              onClick={() => setIsDistractionFree(false)}
            >
              Exit Focus
            </button>
            <button
              type="button"
              style={{
                ...styles.headerBtn,
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.panel,
              }}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? "Windowed" : "Fullscreen"}
            </button>
          </div>
        )}

        <div style={styles.contentLayout}>
          {!isDistractionFree && notesOpen && (
            <aside
              style={{
                ...styles.notesSidebar,
                backgroundColor: theme.panel,
                borderColor: theme.border,
              }}
            >
              <div style={styles.notesHeader}>
                <div>
                  <div style={{ ...styles.notesEyebrow, color: theme.muted }}>
                    Notes
                  </div>
                </div>
                <button
                  type="button"
                  style={{
                    ...styles.iconBtn,
                    color: theme.text,
                    borderColor: theme.border,
                  }}
                  onClick={() => setNotesOpen(false)}
                >
                  Hide
                </button>
              </div>

              <div style={styles.pageField}>
                <span style={{ ...styles.pageLabel, color: theme.muted }}>
                  Page
                </span>
                <input
                  type="text"
                  value={notePageInput}
                  onChange={(event) =>
                    setNotePageInput(
                      event.target.value.replace(/[^\d]/g, "").slice(0, 5),
                    )
                  }
                  placeholder="Page"
                  inputMode="numeric"
                  style={{
                    ...styles.pageInput,
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  }}
                />
              </div>

              <textarea
                ref={noteInputRef}
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Write a note"
                rows={5}
                style={{
                  ...styles.noteInput,
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                }}
              />

              <button
                type="button"
                style={{
                  ...styles.primaryBtn,
                  backgroundColor: theme.accent,
                }}
                onClick={saveNote}
              >
                {editingNoteId ? "Update Note" : "Save Note"}
              </button>
              {editingNoteId && (
                <button
                  type="button"
                  style={{
                    ...styles.headerBtn,
                    color: theme.text,
                    borderColor: theme.border,
                  }}
                  onClick={() => resetNoteComposer()}
                >
                  Cancel Edit
                </button>
              )}

              <div style={styles.notesList}>
                {notes.length === 0 ? (
                  <div
                    style={{
                      ...styles.emptyCard,
                      color: theme.muted,
                      borderColor: theme.border,
                    }}
                  >
                    No notes yet. Write one to save it here.
                  </div>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note._id}
                      style={{
                        ...styles.noteCard,
                        backgroundColor: theme.surface,
                        borderColor:
                          Number(note.page) === currentPage ? theme.accent : theme.border,
                      }}
                    >
                      <div style={styles.noteCardHeader}>
                        <button
                          type="button"
                          style={{ ...styles.notePageBtn, color: theme.text }}
                          onClick={() => openNote(note.page)}
                        >
                          Page {note.page}
                        </button>
                        <div style={styles.noteActions}>
                          <button
                            type="button"
                            style={{
                              ...styles.editBtn,
                              borderColor: theme.border,
                              color: theme.text,
                            }}
                            onClick={() => editNote(note)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            style={styles.deleteBtn}
                            onClick={() => deleteNote(note._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        style={styles.noteBodyBtn}
                        onClick={() => openNote(note.page)}
                      >
                        <span style={{ ...styles.noteBodyText, color: theme.text }}>
                          {note.note || "No content"}
                        </span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </aside>
          )}

          <div style={styles.readerColumn}>
            {!isDistractionFree && !notesOpen && (
              <div style={styles.readerTools}>
                <button
                  type="button"
                  style={{
                    ...styles.headerBtn,
                    color: theme.text,
                    borderColor: theme.border,
                  }}
                  onClick={() => {
                    setNotesOpen(true);
                    setNotePageInput(String(currentPage));
                    window.setTimeout(() => {
                      noteInputRef.current?.focus();
                    }, 0);
                  }}
                >
                  Show Notes
                </button>
              </div>
            )}

            <section
              style={{
                ...styles.viewerCard,
                backgroundColor: theme.panel,
                borderColor: theme.border,
              }}
            >
              {pdfLoading ? (
                <div style={styles.viewerState}>
                  <div style={styles.spinner} />
                  <p style={{ color: theme.muted }}>Loading protected PDF...</p>
                </div>
              ) : (
                <iframe
                  key={viewerSrc}
                  ref={iframeRef}
                  src={viewerSrc}
                  style={styles.pdfFrame}
                  title="E-Book Reader"
                  onLoad={syncCurrentPageFromViewer}
                />
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

const styles = {
  shell: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  state: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    padding: "2rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem 1.25rem",
    flexWrap: "wrap",
  },
  headerIdentity: {
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
    flexWrap: "wrap",
  },
  headerCopy: {
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
  },
  heading: {
    margin: 0,
    fontSize: "1.55rem",
    lineHeight: 1.2,
  },
  metaRow: {
    display: "flex",
    gap: "0.65rem",
    flexWrap: "wrap",
    alignItems: "center",
    fontSize: "0.92rem",
  },
  stage: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: "1rem",
  },
  contentLayout: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    gap: "1rem",
    alignItems: "stretch",
  },
  notesSidebar: {
    width: "320px",
    minWidth: "320px",
    border: "1px solid",
    borderRadius: "24px",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.9rem",
    overflow: "hidden",
    boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
  },
  notesHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "0.75rem",
  },
  notesEyebrow: {
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: "0.72rem",
    fontWeight: "700",
    marginBottom: "0.2rem",
  },
  iconBtn: {
    border: "1px solid",
    backgroundColor: "transparent",
    borderRadius: "999px",
    padding: "0.5rem 0.85rem",
    fontWeight: "700",
    cursor: "pointer",
  },
  noteInput: {
    border: "1px solid",
    borderRadius: "16px",
    padding: "0.9rem 1rem",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: 1.6,
  },
  pageField: {
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
  },
  pageLabel: {
    fontSize: "0.82rem",
    fontWeight: "700",
  },
  pageInput: {
    border: "1px solid",
    borderRadius: "14px",
    padding: "0.8rem 0.95rem",
    outline: "none",
    fontFamily: "inherit",
    fontWeight: "700",
  },
  notesList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.8rem",
    overflowY: "auto",
    paddingRight: "0.1rem",
  },
  emptyCard: {
    border: "1px dashed",
    borderRadius: "16px",
    padding: "1rem",
    lineHeight: 1.6,
    fontSize: "0.92rem",
  },
  noteCard: {
    border: "1px solid",
    borderRadius: "16px",
    padding: "0.9rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.65rem",
  },
  noteCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "0.75rem",
    alignItems: "center",
  },
  noteActions: {
    display: "flex",
    gap: "0.45rem",
    alignItems: "center",
    marginLeft: "auto",
  },
  notePageBtn: {
    border: "none",
    backgroundColor: "transparent",
    padding: 0,
    fontWeight: "800",
    fontSize: "0.96rem",
    cursor: "pointer",
  },
  editBtn: {
    border: "1px solid",
    backgroundColor: "transparent",
    borderRadius: "999px",
    padding: "0.4rem 0.72rem",
    fontWeight: "700",
    cursor: "pointer",
  },
  noteBodyBtn: {
    border: "none",
    backgroundColor: "transparent",
    padding: 0,
    textAlign: "left",
    cursor: "pointer",
  },
  noteBodyText: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    lineHeight: 1.65,
  },
  readerColumn: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  readerTools: {
    display: "flex",
    justifyContent: "flex-start",
  },
  focusBar: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  viewerCard: {
    flex: 1,
    minHeight: 0,
    border: "1px solid",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
  },
  viewerState: {
    minHeight: "420px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    padding: "2rem",
  },
  pdfFrame: {
    width: "100%",
    height: "100%",
    minHeight: "calc(100vh - 245px)",
    border: "none",
  },
  row: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  themeSwitch: {
    display: "flex",
    gap: "0.35rem",
    border: "1px solid",
    borderRadius: "999px",
    padding: "0.3rem",
  },
  themeOptionBtn: {
    border: "none",
    borderRadius: "999px",
    padding: "0.55rem 0.8rem",
    fontWeight: "700",
    cursor: "pointer",
  },
  headerBtn: {
    border: "1px solid",
    backgroundColor: "transparent",
    borderRadius: "999px",
    padding: "0.7rem 1rem",
    fontWeight: "700",
    cursor: "pointer",
  },
  primaryBtn: {
    border: "none",
    color: "#fff",
    borderRadius: "999px",
    padding: "0.75rem 1rem",
    fontWeight: "700",
    cursor: "pointer",
  },
  deleteBtn: {
    border: "none",
    backgroundColor: "rgba(239,68,68,0.12)",
    color: "#dc2626",
    borderRadius: "999px",
    padding: "0.4rem 0.75rem",
    fontWeight: "700",
    cursor: "pointer",
  },
  notice: {
    position: "fixed",
    top: "1rem",
    right: "1rem",
    zIndex: 40,
    padding: "0.85rem 1rem",
    borderRadius: "12px",
    border: "1px solid",
    boxShadow: "0 18px 36px rgba(15,23,42,0.18)",
    maxWidth: "360px",
  },
  spinner: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "4px solid rgba(148,163,184,0.24)",
    borderTopColor: "#8b5cf6",
    animation: "spin 1s linear infinite",
  },
  errorCard: {
    maxWidth: "480px",
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: "16px",
    padding: "2rem",
    border: "1px solid rgba(148,163,184,0.18)",
    textAlign: "center",
  },
  errorTitle: { margin: 0, color: "#f8fafc" },
  errorText: { color: "#cbd5e1", lineHeight: 1.7 },
  secondaryBtn: {
    border: "1px solid rgba(148,163,184,0.28)",
    backgroundColor: "transparent",
    color: "#f8fafc",
    borderRadius: "999px",
    padding: "0.75rem 1rem",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default EbookReaderPage;
