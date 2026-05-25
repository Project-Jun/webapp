// ==========================================================================
// 1. 전역 상태 및 데이터 관리 (프로그램 전체에서 공유되는 변수들)
// ==========================================================================
let searchMode = "menu"; // 현재 검색 모드 설정: "menu"(메뉴명) 또는 "ingredient"(재료명)
let selectedTags = [];   // 사용자가 클릭하여 활성화한 다중 해시태그 필터 배열
let shoppingCart = [];   // 사용자가 체크하여 추가한 장바구니 품목 객체 배열

// [월드컵 전용 상태 변수]
let worldcupFoods = [];  // 현재 라운드(예: 64강)에 남아있는 음식 리스트 배열
let nextRoundFoods = []; // 현재 라운드에서 승리하여 다음 라운드(예: 32강)로 진출 확정된 음식 배열
let wcCurrentPairIndex = 0; // 현재 화면에 출력 중인 매치업 쌍의 인덱스 (0번째 대결, 1번째 대결...)
let wcTotalRounds = 64;  // 토너먼트 총 강수 단계 역추적 스케일 (64 -> 32 -> 16 -> 8 -> 4 -> 2)

// [유틸리티 사전] 특정 음식 텍스트에 매칭할 이모지 맵 객체 (데이터에 이모지가 없을 때 백업용)
const emojiMap = {
  "간장계란밥": "🍚", "김치볶음밥": "🍳", "비빔밥": "🥗", "잡채밥": "🍛",
  "치킨": "🍗", "삼겹살": "🥓", "김치찌개": "🍲", "짜장면": "🍜",
  "떡볶이": "🍡", "부대찌개": "🥘", "제육볶음": "🥩", "보쌈": "🍖",
  "된장찌개": "🍲", "탕수육": "🥠", "국밥": "🥣", "순두부찌개": "🍲"
};

/**
 * 💡 [핵심 최적화 함수] 음식명의 이모지를 지능적으로 추출하는 유틸리티
 */
function getFoodEmoji(foodName) {
  if (!foodName) return "🍔";

  // 1. 정규식을 이용해 문자열 자체에 포함된 이모지/특수 기호가 있는지 검사
  const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
  const found = foodName.match(emojiRegex);
  if (found && found.length > 0) {
    return found[0]; // 이미 포함된 이모지가 있다면 첫 번째 이모지 즉시 반환
  }

  // 2. 이름 자체에 이모지가 없다면 유틸리티 사전(emojiMap)에서 매핑 검색
  const cleanName = foodName.replace(/\s+/g, "");
  for (const key in emojiMap) {
    if (cleanName.includes(key)) {
      return emojiMap[key];
    }
  }

  // 3. 둘 다 해당하지 않는 비주류 음식이면 기본 햄버거 이모지 반환
  return "🍔";
}

/**
 * 💡 음식명에서 순수 텍스트(이모지 제외)만 추출하는 보조 유틸리티
 */
function getCleanFoodName(foodName) {
  if (!foodName) return "";
  const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
  return foodName.replace(emojiRegex, "").trim();
}

// ==========================================================================
// 2. DOMContentLoaded (HTML 빌드 완료 후 초기 이벤트 바인딩)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");

  // 냉장고 페이지 활성화 상태라면 메인 레시피 그리드를 화면에 즉시 로드
  if (document.getElementById("fridge-view")) {
    renderFoods();
  }

  // foodDB 기반 태그 자동 생성
  createTagButtons();

  // 실시간 타이핑 검색창 엔터 및 입력 이벤트 리스너 바인딩
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") renderFoods();
    });
    searchInput.addEventListener("input", renderFoods);
  }

  // 검색 모드 버튼 이벤트 연결
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      // 버튼 active 초기화
      document.querySelectorAll(".mode-btn").forEach(b => {
        b.classList.remove("active");
      });

      // 현재 버튼 활성화
      btn.classList.add("active");

      // 검색 모드 변경
      searchMode = btn.dataset.mode;

      // placeholder 변경
      const searchInput = document.getElementById("search-input");
      if (searchMode === "menu") {
        searchInput.placeholder = "메뉴명을 입력하세요 (예: 김치볶음밥)";
      } else {
        searchInput.placeholder = "재료명을 입력하세요 (예: 김치, 계란, 돼지고기)";
      }

      // 즉시 재렌더링
      renderFoods();
    });
  });
});

// ==========================================================================
// 2-1. foodDB 기반 태그 자동 생성 시스템
// ==========================================================================

// 인기 태그
const popularTags = [
  "간단",
  "가성비",
  "혼밥",
  "매운맛",
  "한식"
];

// 태그 생성
function createTagButtons() {

  // foodDB 전체 태그 추출
  const allTags = [

    ...new Set(

      foodDB.flatMap(food =>

        food.tags || []
      )
    )
  ];

  // 컨테이너
  const popularContainer =
    document.getElementById("popular-tags");

  const normalContainer =
    document.getElementById("normal-tags");

  if (!popularContainer || !normalContainer) return;

  popularContainer.innerHTML = "";
  normalContainer.innerHTML = "";

  // 인기 태그 생성
  popularTags.forEach(tag => {

    if (allTags.includes(tag)) {

      popularContainer.innerHTML +=
        createTagHTML(tag);
    }
  });

  // 일반 태그 생성
  allTags.forEach(tag => {

    if (!popularTags.includes(tag)) {

      normalContainer.innerHTML +=
        createTagHTML(tag);
    }
  });

  // 태그 이벤트 연결
  bindTagEvents();
}

// 버튼 HTML
function createTagHTML(tag) {

  return `
    <button
      class="tag-btn"
      data-tag="${tag}"
    >
      #${tag}
    </button>
  `;
}

// 이벤트 연결
function bindTagEvents() {

  document.querySelectorAll(".tag-btn").forEach(button => {

    button.addEventListener("click", () => {

      const tag = button.dataset.tag;

      if (selectedTags.includes(tag)) {

        selectedTags =
          selectedTags.filter(t => t !== tag);

        button.classList.remove("active");

      } else {

        selectedTags.push(tag);

        button.classList.add("active");
      }

      renderFoods();
    });
  });
}

// ==========================================================================
// 3. 공통 팝업 모달 제어 시스템
// ==========================================================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden"; // 배경 스크롤 방지
  }
}

// 모달 닫기
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "auto"; // 스크롤 복원
  }
}

// 네비게이션 탭 대분류 전환 시스템
function switchView(viewId) {
  document.querySelectorAll(".view-section").forEach(section => {
    section.classList.remove("active");
  });
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.classList.remove("active");
  });

  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.add("active");

  const targetTab = document.querySelector(`[data-view="${viewId}"]`);
  if (targetTab) targetTab.classList.add("active");

  if (viewId === "fridge-view") {
    renderFoods();
  }
}

// ==========================================================================
// 4. [코어 로직] 데이터 필터링 및 동적 화면 렌더링 엔진
// ==========================================================================
function renderFoods() {
  const searchInput = document.getElementById("search-input");
  const resultArea = document.getElementById("food-list");
  if (!resultArea) return;

  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

  // 다중 필터 서브루틴 연산 시작
  const filteredFoods = foodDB.filter(food => {
    // 1차 해시태그 필터 검증
    if (selectedTags.length > 0) {
      const hasAllTags = selectedTags.every(tag => food.tags.includes(tag));
      if (!hasAllTags) return false;
    }

    // 2차 텍스트 입력창 필터 검증
    if (!query) return true;

    if (searchMode === "menu") {
      const cleanName = getCleanFoodName(food.name).toLowerCase();
      return cleanName.includes(query);
    } else {
      // 재료명 다중 검색 (콤마 구분)
      const searchIngredients = query.split(",").map(i => i.trim()).filter(i => i !== "");
      if (searchIngredients.length === 0) return true;

      return searchIngredients.every(searchIng => {
        return food.ingredients.some(foodIng => foodIng.name.toLowerCase().includes(searchIng));
      });
    }
  });

  // 검색 결과 제로 케이스 예외 처리
  if (filteredFoods.length === 0) {
    resultArea.innerHTML = `<div class="empty-cart-msg">🔍 일치하는 요리 레시피 조건이 없습니다. 다른 키워드나 태그를 선택해보세요!</div>`;
    return;
  }

  // 검색 결과 카드 렌더링
  resultArea.innerHTML = "";
  filteredFoods.forEach(food => {
    const emoji = getFoodEmoji(food.name);
    const cleanName = getCleanFoodName(food.name);

    // 체크박스 재료 목록 동적 조립
    let checkBoxesHtml = "";
    food.ingredients.forEach(ing => {
      checkBoxesHtml += `
        <label class="check-label">
          <input type="checkbox" value="${ing.name}" data-food="${cleanName}">
          <span>${ing.name} (${ing.quantity})</span>
        </label>
      `;
    });

    // 레시피 세부 단계 OL 리스트 바인딩
    let recipeStepsHtml = "";
    food.recipe.forEach(step => {
      recipeStepsHtml += `<li>${step}</li>`;
    });

    const cardHtml = `
      <div class="recipe-item">
        <div class="recipe-header">
          <span class="recipe-name">${emoji} ${cleanName}</span>
        </div>
        
        <div class="ingredient-check-section">
          <div class="ingredient-check-title">
            <span>🛒 내 냉장고에 [없는] 재료 체크박스 확인</span>
            <button class="primary-btn btn" style="font-size:0.75rem; padding:4px 10px; border-radius:4px; margin:0;" onclick="addSelectedToCart('${cleanName}')">장바구니 담기</button>
          </div>
          <div class="check-grid" id="check-grid-${cleanName}">
            ${checkBoxesHtml}
          </div>
        </div>

        <div class="recipe-body">
          <p style="font-size:0.85rem; font-weight:bold; color:#ff4757; margin-bottom:8px;">💡 조리 순서 가이드</p>
          <div class="recipe-guide-section">
            <ol>${recipeStepsHtml}</ol>
          </div>
        </div>

        <div style="margin-top:16px;">
          <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(cleanName + ' 레시피')}" target="_blank" class="youtube-btn btn">
            ▶ 유튜브 레시피 보기
          </a>
        </div>
      </div>
    `;
    resultArea.innerHTML += cardHtml;
  });
}

// ==========================================================================
// 5. 🛒 스마트 장바구니 매니지먼트 서브 시스템
// ==========================================================================
function addSelectedToCart(cleanFoodName) {
  const grid = document.getElementById(`check-grid-${cleanFoodName}`);
  if (!grid) return;

  const checkboxes = grid.querySelectorAll('input[type="checkbox"]:checked');
  if (checkboxes.length === 0) {
    alert("장바구니에 추가할 부족한 재료를 먼저 선택해 주세요! 🛒");
    return;
  }

  let addedCount = 0;
  checkboxes.forEach(cb => {
    const ingredientName = cb.value;

    // 장바구니 중복 상시 체크
    const isExist = shoppingCart.some(item => item.name === ingredientName && item.sourceMenu === cleanFoodName);

    if (!isExist) {
      shoppingCart.push({
        name: ingredientName,
        sourceMenu: cleanFoodName,
        memo: ""
      });
      addedCount++;
    }
  });

  if (addedCount > 0) {
    alert(`선택하신 ${addedCount}개의 부족한 재료를 장바구니에 저장했습니다! 🧊`);
    updateCartTable();
    grid.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  } else {
    alert("이미 장바구니에 등록된 재료들입니다. 테이블을 확인해보세요!");
  }
}

function updateCartTable() {
  const tbody = document.getElementById("cart-body");
  const badge = document.getElementById("cart-count-badge");
  if (!tbody) return;

  if (badge) badge.textContent = shoppingCart.length;

  if (shoppingCart.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-cart-msg">🛒 장바구니가 비어 있습니다. 부족한 요리 재료를 채워보세요!</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  shoppingCart.forEach((item, index) => {
    const emoji = getFoodEmoji(item.sourceMenu);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><div class="cart-item-wrapper"><span class="cart-item-name">${item.name}</span></div></td>
      <td><div class="cart-item-wrapper"><span class="cart-item-source">${emoji} ${item.sourceMenu}</span></div></td>
      <td>
        <div class="cart-control-box">
          <input type="text" class="cart-memo-input" value="${item.memo}" placeholder="수량이나 브랜드 메모 입력..." oninput="updateCartMemo(${index}, this.value)">
          <a href="https://www.coupang.com/np/search?component=&q=${encodeURIComponent(item.name)}" target="_blank" class="coupang-btn btn">쿠팡 최저가 검색</a>
        </div>
      </td>
      <td><button class="delete-cart-btn btn" onclick="removeCartItem(${index})">삭제</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function updateCartMemo(index, val) {
  if (shoppingCart[index]) {
    shoppingCart[index].memo = val;
  }
}

function removeCartItem(index) {
  shoppingCart.splice(index, 1);
  updateCartTable();
}

// ==========================================================================
// 6. 🎰 [컴포넌트 1] 메뉴 추천 전동 슬롯머신 로직 (롤링 애니메이션 완벽 구현)
// ==========================================================================
function openRouletteModal() {
  openModal("rouletteModal");

  const reelEmoji = document.getElementById("reel-emoji");
  const reelText = document.getElementById("reel-text");
  const reelTag = document.getElementById("reel-tag");
  const resultCard = document.getElementById("slot-result-card");
  const triggerBtn = document.getElementById("slot-start-btn");

  // 이모지는 크게 유지하고, 메뉴명(가운데)과 태그(오른쪽)의 글자 크기를 1.1rem으로 통일합니다.
  if (reelEmoji) reelEmoji.innerHTML = `<div style="font-size: 2.2rem; transition: transform 0.05s;">❓</div>`;
  if (reelText) reelText.innerHTML = `<div style="font-size: 1.1rem; white-space: nowrap; transition: transform 0.05s;">두근두근</div>`;
  if (reelTag) reelTag.innerHTML = `<div style="font-size: 1.1rem; white-space: nowrap; transition: transform 0.05s;">#추천</div>`;

  if (resultCard) resultCard.style.display = "none";
  if (triggerBtn) triggerBtn.disabled = false;
}

function startSlotMachine() {
  const reelEmoji = document.getElementById("reel-emoji");
  const reelText = document.getElementById("reel-text");
  const reelTag = document.getElementById("reel-tag");
  const resultCard = document.getElementById("slot-result-card");
  const triggerBtn = document.getElementById("slot-start-btn");

  if (foodDB.length === 0) {
    alert("추천할 음식 데이터베이스 풀이 비어있습니다.");
    return;
  }

  triggerBtn.disabled = true;
  if (resultCard) resultCard.style.display = "none";

  let shuffleCount = 0;
  const maxShuffles = 35; // 역동적인 회전 효과를 위한 충분한 반복 횟수
  const speed = 50;       // 0.05초 단위로 초고속 화면 갱신

  const interval = setInterval(() => {
    const randomFood = foodDB[Math.floor(Math.random() * foodDB.length)];
    const cleanName = getCleanFoodName(randomFood.name);
    const emoji = getFoodEmoji(randomFood.name);

    // 상하 진동 모션과 투명도 조절을 통한 실시간 스크롤 착시 유도
    const translateY = shuffleCount % 2 === 0 ? "translateY(-6px)" : "translateY(6px)";
    const blurOpacity = shuffleCount < maxShuffles - 5 ? "opacity: 0.65;" : "opacity: 1;";

    if (reelEmoji) reelEmoji.innerHTML = `<div style="font-size: 2.2rem; transform: ${translateY}; ${blurOpacity}">${emoji}</div>`;
    if (reelText) reelText.innerHTML = `<div style="font-size: 1.1rem; white-space: nowrap; transform: ${translateY}; ${blurOpacity}">${cleanName}</div>`;
    if (reelTag) reelTag.innerHTML = `<div style="font-size: 1.1rem; white-space: nowrap; transform: ${translateY}; ${blurOpacity}">#${randomFood.category || "추천"}</div>`;

    shuffleCount++;

    if (shuffleCount >= maxShuffles) {
      clearInterval(interval);

      const finalFood = foodDB[Math.floor(Math.random() * foodDB.length)];
      const finalCleanName = getCleanFoodName(finalFood.name);
      const finalEmoji = getFoodEmoji(finalFood.name);

      // 최종 정지 상태 연출 (제자리 정렬 및 색상 강조)
      if (reelEmoji) reelEmoji.innerHTML = `<div style="font-size: 2.2rem; transform: translateY(0); transition: all 0.15s; font-weight: bold;">${finalEmoji}</div>`;
      if (reelText) reelText.innerHTML = `<div style="font-size: 1.1rem; white-space: nowrap; transform: translateY(0); transition: all 0.15s; font-weight: bold; color: #ff4757;">${finalCleanName}</div>`;
      if (reelTag) reelTag.innerHTML = `<div style="font-size: 1.1rem; white-space: nowrap; transform: translateY(0); transition: all 0.15s;">#${finalFood.category || "추천"}</div>`;

      // 결과 하단 카드 노출 처리
      if (resultCard) {
        const resNameEl = document.getElementById("slot-result-name") || document.getElementById("slot-result-title");
        if (resNameEl) resNameEl.textContent = `${finalEmoji} ${finalCleanName}`;
        resultCard.style.display = "block";

        const goRecipeBtn = document.getElementById("slot-go-recipe-btn") || document.getElementById("slot-recipe-btn");
        if (goRecipeBtn) {
          goRecipeBtn.onclick = () => {
            closeModal("rouletteModal");
            switchView("fridge-view");
            const searchInput = document.getElementById("search-input");
            if (searchInput) {
              const menuModeBtn = document.querySelector('[data-mode="menu"]');
              if (menuModeBtn) menuModeBtn.click();
              searchInput.value = finalCleanName;
              renderFoods();
            }
          };
        }
      }
      triggerBtn.disabled = false;
    }
  }, speed);
}

// ==========================================================================
// 7. 🏆 [컴포넌트 2] 음식 세계관 최강자 이상형 월드컵 엔진
// ==========================================================================
function openWorldcupModal() {
  startWorldcup(64);
}

function startWorldcup(totalRounds) {
  if (foodDB.length < 2) {
    alert("월드컵을 진행하기에 충분한 요리 데이터가 부족합니다.");
    return;
  }

  wcTotalRounds = totalRounds;

  // 전체 음식 무작위 셔플링
  let shuffled = [...foodDB].sort(() => 0.5 - Math.random());

  // 지정된 강수 스케일링 슬라이싱 조율
  if (shuffled.length > wcTotalRounds) {
    shuffled = shuffled.slice(0, wcTotalRounds);
  } else {
    if (shuffled.length >= 32) wcTotalRounds = 32;
    else if (shuffled.length >= 16) wcTotalRounds = 16;
    else if (shuffled.length >= 8) wcTotalRounds = 8;
    else if (shuffled.length >= 4) wcTotalRounds = 4;
    else wcTotalRounds = 2;
    shuffled = shuffled.slice(0, wcTotalRounds);
  }

  worldcupFoods = shuffled;
  nextRoundFoods = [];
  wcCurrentPairIndex = 0;

  document.querySelector(".worldcup-match-container").style.display = "flex";
  document.getElementById("worldcup-winner-area").style.display = "none";
  openModal("worldcupModal");
  renderWorldcupMatch();
}

function renderWorldcupMatch() {
  const roundTitle = document.getElementById("worldcup-round-title");
  const leftFood = worldcupFoods[wcCurrentPairIndex * 2];
  const rightFood = worldcupFoods[wcCurrentPairIndex * 2 + 1];

  let titlePrefix = `${wcTotalRounds}강`;
  if (wcTotalRounds === 2) titlePrefix = " 결승전 🏁";

  const currentMatchNumber = wcCurrentPairIndex + 1;
  const totalMatchesInRound = wcTotalRounds / 2;
  roundTitle.textContent = `${titlePrefix} (${currentMatchNumber} / ${totalMatchesInRound} 경기)`;

  if (leftFood) {
    document.getElementById("wc-left-emoji").textContent = getFoodEmoji(leftFood.name);
    document.getElementById("wc-left-name").textContent = getCleanFoodName(leftFood.name);
  }
  if (rightFood) {
    document.getElementById("wc-right-emoji").textContent = getFoodEmoji(rightFood.name);
    document.getElementById("wc-right-name").textContent = getCleanFoodName(rightFood.name);
  }
}

function selectWorldcupWinner(selectedIndex) {
  const winnerFood = worldcupFoods[wcCurrentPairIndex * 2 + selectedIndex];
  nextRoundFoods.push(winnerFood);

  wcCurrentPairIndex++;

  if (wcCurrentPairIndex < worldcupFoods.length / 2) {
    renderWorldcupMatch();
  } else {
    if (nextRoundFoods.length === 1) {
      displayWorldcupWinner(nextRoundFoods[0]);
    } else {
      worldcupFoods = nextRoundFoods;
      nextRoundFoods = [];
      wcCurrentPairIndex = 0;
      wcTotalRounds = wcTotalRounds / 2;
      renderWorldcupMatch();
    }
  }
}

function displayWorldcupWinner(winnerFood) {
  document.getElementById("worldcup-round-title").textContent = "🏆 축하합니다! 최종 우승 🏆";
  document.querySelector(".worldcup-match-container").style.display = "none";

  const winnerArea = document.getElementById("worldcup-winner-area");
  const finalCleanName = getCleanFoodName(winnerFood.name);
  const finalEmoji = getFoodEmoji(winnerFood.name);

  if (winnerArea) {
    document.getElementById("worldcup-winner-name").textContent = `${finalEmoji} ${finalCleanName}`;
    winnerArea.style.display = "block";

    const goWinnerRecipeBtn = document.getElementById("winner-go-recipe-btn");
    if (goWinnerRecipeBtn) {
      goWinnerRecipeBtn.onclick = () => {
        closeModal("worldcupModal");
        switchView("fridge-view");
        const searchInput = document.getElementById("search-input");
        if (searchInput) {
          const menuModeBtn = document.querySelector('[data-mode="menu"]');
          if (menuModeBtn) menuModeBtn.click();
          searchInput.value = finalCleanName;
          renderFoods();
        }
      };
    }
  }
}