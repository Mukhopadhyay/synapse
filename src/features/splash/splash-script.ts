/**
 * Runs before first paint: the splash plays once per browser session. A session that has already
 * seen it (or blocks storage) gets `data-splash="seen"` on <html>, which hides the overlay in CSS
 * before it can flash.
 */
const SESSION_KEY = "synapse-splash";

export const splashScript = `(function(){var d=document.documentElement;try{if(sessionStorage.getItem("${SESSION_KEY}")){d.dataset.splash="seen"}else{sessionStorage.setItem("${SESSION_KEY}","1")}}catch(e){d.dataset.splash="seen"}})()`;
