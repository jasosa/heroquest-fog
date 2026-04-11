import { T, FONT_HEADING, FONT_BODY } from './theme.js';

export function applyBootstrapTheme() {
  const root = document.documentElement;

  // Body / base
  root.style.setProperty('--bs-body-bg',           T.pageBg);
  root.style.setProperty('--bs-body-color',         T.text);
  root.style.setProperty('--bs-body-font-family',   FONT_BODY);
  root.style.setProperty('--bs-border-color',       T.panelBorder);

  // Semantic colours
  root.style.setProperty('--bs-primary',            T.accentGold);
  root.style.setProperty('--bs-primary-rgb',        '200, 146, 26');
  root.style.setProperty('--bs-danger',             T.accent);
  root.style.setProperty('--bs-danger-rgb',         '155, 42, 26');
  root.style.setProperty('--bs-secondary-bg',       T.panelBg);

  // Cards
  root.style.setProperty('--bs-card-bg',            T.sidebarBg);
  root.style.setProperty('--bs-card-border-color',  T.panelBorder);
  root.style.setProperty('--bs-card-color',         T.text);

  // Modals
  root.style.setProperty('--bs-modal-bg',           T.sidebarBg);
  root.style.setProperty('--bs-modal-border-color', T.sidebarBorder);
  root.style.setProperty('--bs-modal-color',        T.text);

  // Form inputs
  root.style.setProperty('--bs-input-bg',           T.btnBg);
  root.style.setProperty('--bs-input-border-color', T.btnBorder);
  root.style.setProperty('--bs-input-color',        T.text);
  root.style.setProperty('--bs-input-focus-border-color', T.accentGold);

  // Buttons
  root.style.setProperty('--bs-btn-font-family',    FONT_HEADING);

  // Links
  root.style.setProperty('--bs-link-color',         T.accentGold);

  // Toast / alerts
  root.style.setProperty('--bs-toast-bg',           T.panelBg);
  root.style.setProperty('--bs-toast-border-color', T.panelBorder);
}
