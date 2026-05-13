// js/main.js

const menuList = [];
let foodDB = [];

async function loadFoodDB() {
  try {
    const response = await fetch("json/foodDB.json");
    if (!response.ok) {
      throw new Error(`foodDB.json 로드 실패: ${response.status}`);
    }

    foodDB = await response.json();
    menuList.push(...foodDB.map((item) => item.name));
    recommendMenu();
  } catch (error) {
    console.error(error);
    const todayMenu = document.getElementById("today-menu");
    if (todayMenu) {
      todayMenu.innerText = "메뉴 정보를 불러오는 중 오류가 발생했습니다.";
    }
  }
}

function recommendMenu() {
  if (menuList.length === 0) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * menuList.length);
  document.getElementById("today-menu").innerText = menuList[randomIndex];
}

function goWorldcup() {
  location.href = "worldcup.html";
}

function goFridge() {
  location.href = "fridge.html";
}

loadFoodDB();