import { Component, lazy, Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";

const GhostFibers = lazy(() => import("./components/react-bits/GhostFibers"));
const DitherVeil = lazy(() => import("./components/react-bits/DitherVeil"));

const builds = [
  {
    name: "ARM64",
    file: "bitchat-android-arm64.apk",
    label: "01 / RECOMMENDED",
    description: "For most Android phones",
    size: "20.0 MB",
    primary: true,
  },
  {
    name: "Universal",
    file: "bitchat-android-universal.apk",
    label: "02 / WIDER COMPATIBILITY",
    description: "One APK. More architectures.",
    size: "51.9 MB",
    primary: false,
  },
];

function useVisualEffects() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      let gl: WebGL2RenderingContext | null = null;
      try {
        if (!preference.matches)
          gl = document.createElement("canvas").getContext("webgl2");
        setEnabled(Boolean(gl));
      } catch {
        setEnabled(false);
      } finally {
        gl?.getExtension("WEBGL_lose_context")?.loseContext();
      }
    };
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  return enabled;
}

class VisualBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4" />
    </svg>
  );
}

export default function App() {
  const effects = useVisualEffects();

  return (
    <div className="app-shell">
      <div className="background" aria-hidden="true">
        {effects && (
          <VisualBoundary>
            <Suspense fallback={null}>
              <GhostFibers
                glowColor="#ff8000"
                lineColor="#ffd5ac"
                secondaryColor="#8b331c"
                rotation={-24}
                speed={0.22}
                rollSpeed={0.08}
                layers={2}
                threads={54}
                density={0.7}
                scale={0.85}
                brightness={0.75}
                glow={0.7}
                particles={0.12}
                grain={0.035}
                fiberStyle="lines"
                mouseInteraction={false}
                pulseOnClick={false}
                dpr={1.25}
              />
            </Suspense>
          </VisualBoundary>
        )}
      </div>

      <header className="site-header">
        <div className="wordmark">
          <img className="brand-mark" src="/sozu-icon.png" alt="" />
          <span>
            Sozu Offline<span className="wordmark-dot">.</span>
          </span>
        </div>
        <div className="release-label">
          <span className="status-dot" />
          <span>ANDROID RELEASE</span>
          <span className="version">v2.0.3</span>
        </div>
      </header>

      <main className="hero">
        <div className="eyebrow">
          <span /> LESS SIGNAL. MORE CONNECTION.
        </div>
        <h1>
          Pay offline.
          <br />
          <span>No internet.</span>
        </h1>
        <p className="intro">
          Humanitarian aid, catastrophes, and any other time the signal is gone.
          <br />
          Choose your Android build below.
        </p>

        <div className="downloads" aria-label="Android APK downloads">
          {builds.map((build) => (
            <a
              key={build.name}
              className={`download-card${build.primary ? " download-card-primary" : ""}`}
              href={`/downloads/${build.file}`}
              download={build.file}
              aria-label={`Download Bitchat ${build.name} APK`}
            >
              <div className="card-visual" aria-hidden="true">
                {effects && (
                  <VisualBoundary>
                    <Suspense fallback={null}>
                      <DitherVeil
                        src="/artwork/orbit.svg"
                        fit="cover"
                        pattern="bayer"
                        pixelSize={3}
                        inkColor={build.primary ? "#1b120d" : "#111315"}
                        paperColor={build.primary ? "#ce7840" : "#99958c"}
                        revealRadius={125}
                        softness={0.6}
                        linger={0.8}
                        rimColor="#ff8000"
                        rim={0.08}
                        clickBurst={false}
                      />
                    </Suspense>
                  </VisualBoundary>
                )}
              </div>
              <div className="card-content">
                <div className="card-topline">
                  <span className="build-label">{build.label}</span>
                  <span className="download-icon">
                    <DownloadIcon />
                  </span>
                </div>
                <div>
                  <span className="card-title">Download {build.name}</span>
                  <span className="card-description">
                    {build.description}
                    <span className="separator">·</span>
                    {build.size}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
        <p className="compatibility">
          <span className="android-symbol" aria-hidden="true">
            ↳
          </span>{" "}
          Android 8.0+<span>·</span>Official upstream APKs<span>·</span>No app
          store needed
        </p>

        <section className="explain" aria-label="What Sozu Offline does">
          <h2>What it does</h2>
          <p>
            Two phones pay when there is no signal. One signs a cheque. The
            other hears it over Bluetooth. Stellar accepts that note once. A
            second spend of the same note fails on chain.
          </p>
          <h2>How it works</h2>
          <ol>
            <li>
              <span>01</span>
              <div>
                <strong>Deposit</strong>
                <p>
                  A Sozu account holds the value. An NFC tap only opens the
                  account. The card is not the payment.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Pay offline</strong>
                <p>
                  The cheque moves from phone to phone. The screen says pending,
                  then heard.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Settle once</strong>
                <p>
                  The first phone back online sends the cheque to Stellar. The
                  screen says settled. Spending that note again fails.
                </p>
              </div>
            </li>
          </ol>
        </section>
      </main>

      <footer className="site-footer">
        <span>BUILT FOR THE IN-BETWEEN.</span>
        <nav className="footer-links" aria-label="Sozu Offline">
          <a
            href="https://github.com/Sozu-Capital/sozu-offline"
            aria-label="GitHub repository"
            target="_blank"
            rel="noreferrer"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.68 7.68 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </a>
          <a
            href="https://x.com/sozucapital"
            aria-label="Twitter"
            target="_blank"
            rel="noreferrer"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M12.6.75h2.45l-5.36 6.13L16 15.25h-4.94l-3.87-5.06-4.43 5.06H.3l5.73-6.55L0 .75h5.06l3.5 4.63L12.6.75Zm-.86 13.03h1.36L4.32 2.15H2.86l8.88 11.63Z" />
            </svg>
          </a>
        </nav>
        <span>
          SOZU OFFLINE <span className="footer-slash">/</span> 2026
        </span>
      </footer>
    </div>
  );
}
