// BBR - avatar de perfil independiente del acceso de cliente
const DEFAULT_AVATAR = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#e9eee9"/><circle cx="50" cy="37" r="18" fill="#87958b"/><path d="M15 94c2-22 16-34 35-34s33 12 35 34" fill="#87958b"/></svg>');
const saved = localStorage.getItem("bbr_profile_photo");
const img = document.getElementById("bbr-header-avatar");
if (img) img.src = saved || DEFAULT_AVATAR;
