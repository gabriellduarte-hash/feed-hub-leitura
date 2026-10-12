/** Script inline do layout: o navegador avisa que dá pra instalar o app
 * (beforeinstallprompt) logo no carregamento, às vezes antes do React. O
 * script guarda o evento e avisa o ConviteInstalar com
 * "dailypaper:instalavel". Fica fora do componente porque módulo com
 * "use client" não exporta texto pro layout do servidor. */
export const SCRIPT_INSTALAR =
  "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__eventoInstalar=e;" +
  "window.dispatchEvent(new Event('dailypaper:instalavel'))});";
