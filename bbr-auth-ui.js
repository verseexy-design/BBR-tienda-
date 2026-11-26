import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
const config={apiKey:"AIzaSyAY--0sITaphFA-KNcxmDflt8u3jdZkJ5g",authDomain:"bbr-shop-bb00f.firebaseapp.com",projectId:"bbr-shop-bb00f",storageBucket:"bbr-shop-bb00f.firebasestorage.app",messagingSenderId:"967839070632",appId:"1:967839070632:web:bc14902b6abb0f4922059d"};
const app=getApps().length?getApps()[0]:initializeApp(config);
const auth=getAuth(app);
onAuthStateChanged(auth,user=>{
 const link=document.getElementById("bbr-header-profile");
 const img=document.getElementById("bbr-header-avatar");
 if(!link||!img)return;
 if(user){
  const saved=localStorage.getItem("bbr_profile_photo_"+user.uid);
  img.src=saved||user.photoURL||"";
  link.hidden=false;
 }else{link.hidden=true;img.removeAttribute("src");}
});
