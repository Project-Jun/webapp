// ==========================================================================
// 1. 전역 상태 및 데이터 관리
// ==========================================================================
let searchMode = "menu"; // "menu" (메뉴명) 또는 "ingredient" (재료명)
let selectedTags = [];   // 선택된 해시태그 필터 배열
let shoppingCart = [];   // 장바구니 품목 상태 저장 배열

// 음식 월드컵 전역 데이터 구조
let worldcupFoods = [];  // 이번 라운드에 진출한 음식 리스트
let nextRoundFoods = []; // 선택받아 다음 라운드로 올라갈 음식 리스트
let wcCurrentPairIndex = 0; // 현재 매치업 인덱스
let wcTotalRounds = 64;  // 현재 월드컵의 총 강수 (64 -> 32 -> 16 -> 8 -> 4 -> 2)

// 이모지 자동 매핑 사전 유틸리티
const emojiMap = {
  "간장계란밥": "🍚", "김치볶음밥": "🍳", "비빔밥": "🥗", "잡채밥": "🍛",
  "치킨": "🍗", "삼겹살": "🥓", "김치찌개": "🍲", "짜장면": "🍜",
  "떡볶이": "🍡", "부대찌개": "🥘", "제육볶음": "🥩", "보쌈": "🍖",
  "된장찌개": "🍲", "탕수육": "🥠", "국밥": "🥣", "순두부찌개": "🍲"
};

function getEmoji(foodName) {
  const cleanName = foodName.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();
  return emojiMap[cleanName] || "🍕";
}

// 안전 데이터셋 확보 브릿지 함수
function getActiveDataset() {
  if (typeof foodDB !== "undefined" && foodDB.length > 0) {
    return foodDB;
  }
  return [];
}

// ==========================================================================
// 2. SPA(싱글 페이지) 탭 화면 스위칭
// ==========================================================================
function switchView(viewId) {
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  const activeSec = document.getElementById(viewId);
  if (activeSec) activeSec.classList.add('active');

  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
  const activeTab = document.querySelector(`[data-view="${viewId}"]`);
  if (activeTab) activeTab.classList.add('active');

  if (viewId === 'fridge-view') {
    renderFoods();
  }
}

// ==========================================================================
// 3. 🎰 [신규 구현] 빠칭코 / 슬롯머신 추천 엔진 로직
// ==========================================================================
function startSlotMachine() {
  const db = getActiveDataset();
  if (db.length === 0) return;

  const startBtn = document.getElementById("slot-start-btn");
  startBtn.disabled = true;
  startBtn.innerText = "🎰 회전 중... 🎰";

  document.getElementById("slot-result-card").style.display = "none";

  const reelEmoji = document.getElementById("reel-emoji");
  const reelName = document.getElementById("reel-name");
  const reelTag = document.getElementById("reel-tag");

  let counter = 0;
  const maxTicks = 20; // 스크롤 횟수
  const intervalTime = 80; // 스크롤 속도 (ms)

  const slotTimer = setInterval(() => {
    // 셔플 이펙트용 무작위 인덱스 추출
    const randFood = db[Math.floor(Math.random() * db.length)];
    
    reelEmoji.innerHTML = `<div>${getEmoji(randFood.name)}</div>`;
    reelName.innerHTML = `<div>${randFood.name.replace(/[^가-힣a-zA-Z0-9\s]/g, '')}</div>`;
    reelTag.innerHTML = `<div>#${randFood.category || "추천"}</div>`;

    counter++;
    if (counter >= maxTicks) {
      clearInterval(slotTimer);
      
      // 최종 정착 메뉴 결정
      const finalFood = db[Math.floor(Math.random() * db.length)];
      
      reelEmoji.innerHTML = `<div>${getEmoji(finalFood.name)}</div>`;
      reelName.innerHTML = `<div>${finalFood.name.replace(/[^가-힣a-zA-Z0-9\s]/g, '')}</div>`;
      reelTag.innerHTML = `<div>#${finalFood.category || "추chen"}</div>`;

      // 메인 상단 헤더 연동 업데이트
      document.getElementById("today-menu").innerText = `${getEmoji(finalFood.name)} ${finalFood.name}`;

      // 결과 영역 바인딩 노출
      document.getElementById("slot-result-title").innerText = `${getEmoji(finalFood.name)} ${finalFood.name}`;
      const recBtn = document.getElementById("slot-recipe-btn");
      recBtn.onclick = () => {
        closeModal('rouletteModal');
        switchView('fridge-view');
        const srcInput = document.getElementById("search-input");
        if (srcInput) srcInput.value = finalFood.name.replace(/[^가-힣a-zA-Z0-9\s]/g, '').trim();
        renderFoods();
      };

      document.getElementById("slot-result-card").style.display = "block";
      startBtn.disabled = false;
      startBtn.innerText = "🎰 다시 START !!";
    }
  }, intervalTime);
}

// ==========================================================================
// 4. 🏆 음식 이상형 월드컵 로직 (64강 완벽 구동형)
// ==========================================================================
function openWorldcupModal() {
  const db = getActiveDataset();
  if (db.length < 2) {
    alert("데이터가 부족하여 월드컵을 시작할 수 없습니다.");
    return;
  }

  // 64개 셔플 및 정제 배열 가공 추출
  let shuffled = [...db].sort(() => 0.5 - Math.random());
  worldcupFoods = shuffled.slice(0, 64);
  wcTotalRounds = worldcupFoods.length; // 64강 초기화
  nextRoundFoods = [];
  wcCurrentPairIndex = 0;

  document.querySelector(".worldcup-match-container").style.display = "flex";
  document.getElementById("worldcup-winner-area").style.display = "none";

  setupWorldcupMatch();
  openModal('worldcupModal');
}

function setupWorldcupMatch() {
  document.getElementById("worldcup-round-title").innerText = `${wcTotalRounds}강 - [ ${wcCurrentPairIndex + 1} / ${wcTotalRounds / 2} 매치 ]`;

  const foodLeft = worldcupFoods[wcCurrentPairIndex * 2];
  const foodRight = worldcupFoods[wcCurrentPairIndex * 2 + 1];

  document.getElementById("wc-left-emoji").innerText = getEmoji(foodLeft.name);
  document.getElementById("wc-left-name").innerText = foodLeft.name;

  document.getElementById("wc-right-emoji").innerText = getEmoji(foodRight.name);
  document.getElementById("wc-right-name").innerText = foodRight.name;
}

function selectWorldcupWinner(selectedIndex) {
  const winner = worldcupFoods[wcCurrentPairIndex * 2 + selectedIndex];
  nextRoundFoods.push(winner);

  wcCurrentPairIndex++;

  if (wcCurrentPairIndex >= wcTotalRounds / 2) {
    // 한 라운드 종료
    worldcupFoods = [...nextRoundFoods];
    nextRoundFoods = [];
    wcCurrentPairIndex = 0;
    wcTotalRounds = worldcupFoods.length;

    if (wcTotalRounds === 1) {
      // 대망의 최종 결승 우승자 탄생
      displayWorldcupWinner(worldcupFoods[0]);
    } else {
      setupWorldcupMatch();
    }
  } else {
    setupWorldcupMatch();
  }
}

function displayWorldcupWinner(winnerFood) {
  document.querySelector(".worldcup-match-container").style.display = "none";
  document.getElementById("worldcup-round-title").innerText = "🏆 FINAL WINNER 🏆";

  const wNameEl = document.getElementById("worldcup-winner-name");
  wNameEl.innerText = `${getEmoji(winnerFood.name)} ${winnerFood.name}`;

  // 우승 음식을 냉장고를 부탁해 탭에 입력하고 자동 매칭 링크 인계
  const srcInput = document.getElementById("search-input");
  if (srcInput) srcInput.value = winnerFood.name.replace(/[^가-힣a-zA-Z0-9\s]/g, '').trim();

  document.getElementById("worldcup-winner-area").style.display = "block";
}

// ==========================================================================
// 5. 🧊 냉장고를 부탁해 서치 엔진 & 체크박스 연동 로직
// ==========================================================================
function renderFoods() {
  const db = getActiveDataset();
  const resultArea = document.getElementById("food-list");
  const query = document.getElementById("search-input").value.trim().toLowerCase();

  if (db.length === 0) {
    resultArea.innerHTML = '<div class="no-result">로딩 가능한 레시피 데이터셋이 없습니다.</div>';
    return;
  }

  // 필터 레이어 검색 알고리즘 바인딩
  let filteredFoods = db.filter(food => {
    // 1. 모드 조건 필터링
    let matchQuery = false;
    if (!query) {
      matchQuery = true;
    } else if (searchMode === "menu") {
      matchQuery = food.name.toLowerCase().includes(query);
    } else if (searchMode === "ingredient") {
      matchQuery = food.ingredients.some(ing => ing.name.toLowerCase().includes(query));
    }

    // 2. 해시태그 조건 만족 필터링 (다중 교집합 필터)
    let matchTags = true;
    if (selectedTags.length > 0) {
      matchTags = selectedTags.every(t => (food.tags || []).includes(t) || food.category === t);
    }

    return matchQuery && matchTags;
  });

  if (filteredFoods.length === 0) {
    resultArea.innerHTML = `<div class="no-result">😢 조건에 맞는 추천 레시피를 찾지 못했습니다. 다른 재료를 검색해보세요!</div>`;
    return;
  }

  resultArea.innerHTML = '';
  filteredFoods.forEach(food => {
    let checkBoxesHtml = "";
    food.ingredients.forEach((ing, index) => {
      checkBoxesHtml += `
        <label class="check-label">
          <input type="checkbox" class="ing-chk-${food.id}" value="${ing.name}">
          <span>${ing.name} <small style="color:#aaa;">(${ing.quantity || ''})</small></span>
        </label>
      `;
    });

    const cardHtml = `
      <div class="recipe-item">
        <div class="recipe-header">
          <span class="recipe-name">${getEmoji(food.name)} ${food.name}</span>
          <button class="primary-btn" style="font-size:0.8rem; padding:6px 12px; border-radius:6px;" onclick="addSelectedToCart(${food.id}, '${food.name}')">장바구니 담기</button>
        </div>
        <div class="ingredient-check-section">
          <div class="ingredient-check-title">
            <span>🛒 냉장고에 [없는] 재료 체크박스 확인</span>
          </div>
          <div class="check-grid">
            ${checkBoxesHtml}
          </div>
        </div>
        <div class="recipe-guide-section">
          <span class="guide-title">💡 조리법 가이드</span>
          <ol>
            ${(food.recipe || []).map(step => `<li>${step}</li>`).join('')}
          </ol>
        </div>
      </div>
    `;
    resultArea.innerHTML += cardHtml;
  });
}

// ==========================================================================
// 6. 🛒 [기능 고도화] 장바구니 리스트 및 쿠팡 원클릭 다이렉트 연동 엔진
// ==========================================================================
function addSelectedToCart(foodId, foodName) {
  const checkboxes = document.querySelectorAll(`.ing-chk-${foodId}`);
  let addedCount = 0;

  checkboxes.forEach(chk => {
    if (chk.checked) {
      const ingName = chk.value;
      // 중복 체크 가드
      const isExist = shoppingCart.some(item => item.name === ingName && item.source === foodName);
      
      if (!isExist) {
        shoppingCart.push({
          name: ingName,
          source: foodName,
          memo: ""
        });
        addedCount++;
      }
    }
  });

  if (addedCount === 0) {
    alert("냉장고에 없는 재료 체크박스에 먼저 체크를 한 뒤 버튼을 눌러주세요!");
  } else {
    updateCartUI();
    // 장바구니가 잘 보이도록 홈 화면 상단 탭 장바구니 섹션으로 안전 스위칭 안내 스크롤 바인딩
    alert(`${addedCount}개의 부족한 재료가 아래 장바구니에 실시간 추가되었습니다.`);
  }
}

function updateCartUI() {
  const cartBody = document.getElementById("cart-body");
  const badge = document.getElementById("cart-count-badge");

  badge.innerText = `${shoppingCart.length}개 품목`;

  if (shoppingCart.length === 0) {
    cartBody.innerHTML = `
      <tr>
        <td colspan="3" class="empty-cart-msg">
          장바구니가 비어 있습니다.<br><small style="color:#bbb;">[냉장고를 부탁해]에서 부족한 재료를 체크해 담아보세요!</small>
        </td>
      </tr>
    `;
    return;
  }

  cartBody.innerHTML = "";
  shoppingCart.forEach((item, index) => {
    // 쿠팡 검색 다이렉트 한글 퍼센트 인코딩 딥링크 파싱 생성
    const targetQuery = encodeURIComponent(item.name);
    const coupangUrl = `https://www.coupang.com/np/search?component=&q=${targetQuery}&channel=user`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="cart-item-wrapper">
          <span class="cart-item-name">🥕 ${item.name}</span>
          <span class="cart-item-source">출처: ${item.source}</span>
        </div>
      </td>
      <td>
        <div class="cart-control-box">
          <a href="${coupangUrl}" target="_blank" class="coupang-btn">
            🚀 쿠팡 원클릭 검색
          </a>
          <input type="text" class="cart-memo-input" placeholder="수량 등 메모 입력..." value="${item.memo}" onchange="updateCartMemo(${index}, this.value)">
        </div>
      </td>
      <td style="text-align: center;">
        <button class="delete-cart-btn" onclick="deleteCartItem(${index})">삭제</button>
      </td>
    `;
    cartBody.appendChild(tr);
  });
}

function updateCartMemo(index, val) {
  if (shoppingCart[index]) {
    shoppingCart[index].memo = val;
  }
}

function deleteCartItem(index) {
  shoppingCart.splice(index, 1);
  updateCartUI();
}

// ==========================================================================
// 7. 초기화 및 전역 이벤트 리스너 바인딩 구동
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  // 장바구니 초기 테이블 UI 렌더링
  updateCartUI();

  // 검색창 실시간 키 입력 바인딩 처리
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") renderFoods();
    });
    searchInput.addEventListener("input", renderFoods);
  }

  // 검색 방식 모드 스위칭 핸들러 (메뉴명 ↔ 재료명)
  document.querySelectorAll(".mode-btn").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".mode-btn").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      searchMode = button.dataset.mode;

      if (searchInput) {
        if (searchMode === "menu") {
          searchInput.placeholder = "메뉴명을 입력하세요 (예: 김치볶음밥)";
        } else {
          searchInput.placeholder = "재료명을 입력하세요 (쉼표 구분 가능 예: 계란, 밥)";
        }
      }
      renderFoods();
    });
  });

  // 해시태그 멀티 필터링 버튼 클릭 토글러
  document.querySelectorAll(".tag-btn").forEach(button => {
    button.addEventListener("click", () => {
      const tag = button.dataset.tag;

      if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter(t => t !== tag);
        button.classList.remove("active");
      } else {
        selectedTags.push(tag);
        button.classList.add("active");
      }
      renderFoods();
    });
  });
});

// 모달 레이어 안전 유틸리티 제어기
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
}

function openRouletteModal() { openModal('rouletteModal'); }