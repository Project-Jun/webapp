// js/main.js

const menuList = [
  "김치찌개 🍲",
  "떡볶이 🌶️",
  "치킨 🍗",
  "돈까스 🍛",
  "마라탕 🔥",
  "제육볶음 🍖",
  "파스타 🍝",
  "햄버거 🍔",
  "삼겹살 🥓"
];

// 랜덤 메뉴 추천
function recommendMenu() {

  const randomIndex =
    Math.floor(Math.random() * menuList.length);

  document.getElementById("today-menu").innerText =
    menuList[randomIndex];
}

// 페이지 이동
function goWorldcup() {
  location.href = "worldcup.html";
}

function goFridge() {
  location.href = "fridge.html";
}

// 첫 로딩 시 랜덤 메뉴
recommendMenu();