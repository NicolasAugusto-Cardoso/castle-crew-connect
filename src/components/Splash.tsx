import React, { useEffect } from 'react';

interface SplashProps {
  onComplete: () => void;
}

/**
 * Vinheta UniCristo
 * - Fundo preto (#000)
 * - Cruz minimalista no lugar do "t" que vira dourada (#D4AF37)
 * - Palavra "unicristo" revelada por uma linha luminosa branca
 * - Subtítulo "TORNANDO JESUS MAIS CONHECIDO"
 * - Responsivo (mobile / tablet / desktop)
 * - Duração total ~3.1s (com fade-out final)
 */
export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3100);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="uc-splash-root fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: '#000000',
        fontFamily: "'Montserrat', system-ui, sans-serif",
        animation: 'uc_splashFadeOut 200ms ease-out 2900ms forwards',
      }}
    >
      <style>{`
        /* ===== KEYFRAMES ===== */
        @keyframes uc_revealText {
          0%   { clip-path: inset(0 100% 0 0); }
          100% { clip-path: inset(0 0 0 0); }
        }
        @keyframes uc_moveLine {
          0%   { left: 0%; }
          100% { left: 100%; }
        }
        @keyframes uc_fadeOutLine {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes uc_turnGold {
          0%   { background-color: #ffffff; box-shadow: none; }
          100% { background-color: #D4AF37; box-shadow: 0 0 10px rgba(212,175,55,0.8); }
        }
        @keyframes uc_fadeSubtitle {
          0%   { opacity: 0; transform: translateY(-5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes uc_splashFadeOut {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }

        /* ===== ESTRUTURA ===== */
        .uc-splash-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .uc-logo-container {
          position: relative;
          display: inline-block;
          padding-right: 8px; /* compensa o letter-spacing final */
        }

        .uc-word-wrapper {
          display: flex;
          align-items: center;
          font-size: 38px;
          font-weight: 200;
          color: #ffffff;
          letter-spacing: 8px;
          clip-path: inset(0 100% 0 0);
          animation: uc_revealText 1.8s ease-in-out forwards;
          white-space: nowrap;
        }

        .uc-drawing-line {
          position: absolute;
          top: -10%;
          left: 0;
          height: 120%;
          width: 2px;
          background-color: #ffffff;
          box-shadow: 0 0 10px #ffffff, 0 0 20px #ffffff;
          animation:
            uc_moveLine 1.8s ease-in-out forwards,
            uc_fadeOutLine 0.3s ease-out 1.8s forwards;
          z-index: 5;
        }

        /* Cruz minimalista (substitui o "t") */
        .uc-cross {
          position: relative;
          width: 16px;
          height: 34px;
          margin-right: 8px;
          display: inline-block;
          transform: translateY(-2px);
        }
        .uc-cross::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 100%;
          background-color: #ffffff;
          animation: uc_turnGold 1s ease-in-out 2s forwards;
        }
        .uc-cross::after {
          content: '';
          position: absolute;
          top: 30%;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #ffffff;
          animation: uc_turnGold 1s ease-in-out 2s forwards;
        }

        .uc-subtitle {
          font-size: 11px;
          font-weight: 400;
          color: #888888;
          letter-spacing: 5px;
          margin-top: 15px;
          opacity: 0;
          text-align: center;
          animation: uc_fadeSubtitle 0.8s ease-in-out 2.3s forwards;
        }

        /* ===== RESPONSIVO ===== */
        /* Smartphones (até 767px) */
        @media (max-width: 767px) {
          .uc-word-wrapper {
            font-size: 24px;
            letter-spacing: 5px;
          }
          .uc-logo-container {
            padding-right: 5px;
          }
          .uc-cross {
            width: 10px;
            height: 22px;
            margin-right: 5px;
            transform: translateY(-1px);
          }
          .uc-subtitle {
            font-size: 8px;
            letter-spacing: 3px;
            margin-top: 10px;
            padding: 0 15px;
          }
        }

        /* Desktops grandes (1200px+) */
        @media (min-width: 1200px) {
          .uc-word-wrapper {
            font-size: 52px;
            letter-spacing: 12px;
          }
          .uc-logo-container {
            padding-right: 12px;
          }
          .uc-cross {
            width: 22px;
            height: 46px;
            margin-right: 12px;
            transform: translateY(-3px);
          }
          .uc-subtitle {
            font-size: 14px;
            letter-spacing: 8px;
            margin-top: 20px;
          }
        }
      `}</style>

      <div className="uc-splash-container">
        <div className="uc-logo-container">
          <div className="uc-drawing-line" />
          <div className="uc-word-wrapper">
            <span>unicris</span>
            <span className="uc-cross" aria-hidden="true" />
            <span>o</span>
          </div>
        </div>
        <div className="uc-subtitle">TORNANDO JESUS MAIS CONHECIDO</div>
      </div>
    </div>
  );
};
