import React, { useEffect, useState } from 'react';
import logoDark from '../../assets/bl.png';
import logo from '../../assets/logo.png';
import white from '../../assets/whi.png';


interface LogoProps {
  className?: string;
  forceVariant?: 'default' | 'dark' | 'white';
}

const Logo: React.FC<LogoProps> = ({ className = "", forceVariant }) => {
  const [theme, setTheme] = useState<string>('default');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string>("");
  
  // Constante para la duración de la transición en ms
  const TRANSITION_DURATION = 400;

  useEffect(() => {
    // Get initial theme
    const initialTheme = document.documentElement.getAttribute('data-theme') || 'default';
    setTheme(initialTheme);
    
    // Establecer el logo inicial
    const initialLogo = getLogo(initialTheme);
    setCurrentLogo(initialLogo);

    // Create observer to watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setIsTransitioning(true);
          const newTheme = document.documentElement.getAttribute('data-theme') || 'default';
          
          // Primero iniciar la transición de salida
          setTimeout(() => {
            // Una vez que se ha desvanecido, actualizar el logo y el tema
            setTheme(newTheme);
            setCurrentLogo(getLogo(newTheme));
            
            // Luego iniciar la transición de entrada con un pequeño retraso
            setTimeout(() => {
              setIsTransitioning(false);
            }, 50);
          }, TRANSITION_DURATION / 2);
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    // Cleanup
    return () => observer.disconnect();
  }, []);

  // Función auxiliar para obtener el logo según el tema
  const getLogo = (currentTheme: string): string => {
    switch (currentTheme) {
      case 'dark':
        return white.src;
      case 'dark-green':
        return logoDark.src;
      default:
        return logo.src;
    }
  };

  // Seleccionar el logo según el tema o la variante forzada
  const getLogoSrc = () => {
    // Si hay una variante forzada mediante props, usarla
    if (forceVariant) {
      if (forceVariant === 'white') return white.src;
      if (forceVariant === 'dark') return logoDark.src;
      return logo.src;
    }
    
    // Si estamos en transición, usar el logo actual almacenado en el estado
    if (isTransitioning && currentLogo) {
      return currentLogo;
    }
    
    // Si no hay variante forzada, determinar por el tema actual
    switch (theme) {
      case 'dark':
        return white.src;
      case 'dark-green':
        return logoDark.src;
      default:
        return logo.src;
    }
  };

  return (
    <div className={`h-full aspect-square relative ${className}`}>
      <img
        src={getLogoSrc()}
        alt="Logo IS.INSTALACIONES"
        className={`h-full w-auto object-contain transition-all duration-400 ease-in-out
          ${isTransitioning ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}
      />
    </div>
  );
};

export default Logo;