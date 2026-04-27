import React, { useEffect } from 'react';

interface SplashProps {
  onComplete: () => void;
}

/**
 * Vinheta UniCristo
 * - Fundo preto puro (#000)
 * - Cruz minimalista que vira dourada (#D4AF37)
 * - Palavra "unicristo" revelada por uma linha luminosa branca
 * - Subtítulo "TORNANDO JESUS MAIS CONHECIDO"
 * - Duração total ~3s
 */
export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  useEffect(() => {
    // Anima por ~3.1s e sinaliza fim (App fará fade-out via troca de tela)
    const timer = setTimeout(() => {
      onComplete();
    }, 3100);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden animate-[splashFadeOut_200ms_ease-out_2900ms_forwards]"
      style={{
        backgroundColor: '#000000',
        fontFamily: "'Montserrat', system-ui, sans-serif",
      }}
    >
      <style>{`
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
        @keyframes splashFadeOut {
          0%   { opacity: 1; }
          100% { opacity: 0; }
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

        /* Cruz no lugar do "t" — mesma altura visual da letra (38px) e ritmo do letter-spacing */
        .uc-cross {
          position: relative;
          width: 14px;
          height: 38px;
          margin: 0 8px;
          display: inline-block;
          vertical-align: middle;
          transform: translateY(-3px);
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
          top: 28%;
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
          animation: uc_fadeSubtitle 0.8s ease-in-out 2.3s forwards;
          text-align: center;
        }
      `}</style>

      <div className="flex flex-col items-center justify-center">
        <div className="relative inline-block" style={{ paddingRight: 8 }}>
          <span className="uc-drawing-line" />
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
