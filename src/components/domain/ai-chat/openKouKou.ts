/**
 * @file openKouKou.ts
 * @description Opens the floating KouKou widget (`KouKouChatWidget`) from anywhere on the page.
 */

export function openKouKou() {
  window.dispatchEvent(new CustomEvent('skillswap:open-koukou'));
}
