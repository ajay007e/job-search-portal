const exitBtn = document.querySelector(".exit-symbol");
const createAcountBtn = document.getElementById("signup");
const downBtn = document.querySelector(".downBtn");
const editBtn = document.querySelector(".btn-edit");
const homeBtn = document.querySelector(".sec-2");

downBtn?.addEventListener("click", function () {
  document.querySelector(".way-2").classList.toggle("active");
  document.querySelector(".fa-angle-down").classList.toggle("active");
});

createAcountBtn?.addEventListener("click", function () {
  //   console.log();
  document.querySelector(".sec-2").style.opacity = ".1";
  document.querySelector(".sec-3").style.display = "block";
  document.querySelector(".sec-3").style.visibility = "visible";
  document.querySelector(".sec-3").style.opacity = "1";
});
exitBtn?.addEventListener("click", function () {
  //   console.log("clicked");
  document.querySelector(".sec-3").style.display = "none";
  document.querySelector(".sec-3").style.visibility = "hidden";
  document.querySelector(".sec-2").style.opacity = "1";
  document.querySelector(".sec-3").style.opacity = "0";
});

editBtn?.addEventListener("click", function () {
  document.querySelector(".btn-save").style.visibility = "visible";
  document.querySelectorAll("input").forEach((val) => {
    val.removeAttribute("readonly");
  });
});

homeBtn?.addEventListener("click", function (e) {
  if (e.x > 30 && e.x < 85 && e.y > 20 && e.y < 85) {
    // console.log(e.x, e.y);
    window.location = "/";
  }
});
