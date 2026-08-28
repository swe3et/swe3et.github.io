const quizWords = [
  { word: 'abundant', phonetic: '/əˈbʌndənt/', zh: '大量的；充裕的', level: 'Level 5', options: ['大量的；充裕的', '急迫的；緊急的', '模糊的；不清楚的', '謹慎的；小心的'] },
  { word: 'cautious', phonetic: '/ˈkɔːʃəs/', zh: '謹慎的；小心的', level: 'Level 3', options: ['謹慎的；小心的', '充滿好奇的', '有說服力的', '持續的'] },
  { word: 'diligent', phonetic: '/ˈdɪlɪdʒənt/', zh: '勤奮的；用功的', level: 'Level 3', options: ['勤奮的；用功的', '精緻的；脆弱的', '明顯的；顯著的', '冷漠的；無情的'] },
  { word: 'essential', phonetic: '/ɪˈsenʃəl/', zh: '必要的；本質的', level: 'Level 2', options: ['必要的；本質的', '特別地；尤其', '可延展的', '暫時的'] },
  { word: 'frequent', phonetic: '/ˈfriːkwənt/', zh: '頻繁的；經常的', level: 'Level 2', options: ['頻繁的；經常的', '破碎的；片段', '芬芳的', '獨特的；唯一的'] },
  { word: 'generous', phonetic: '/ˈdʒenərəs/', zh: '慷慨的；寬大的', level: 'Level 2', options: ['慷慨的；寬大的', '一般的；普遍的', '天才；才智', '產生；生成'] },
  { word: 'persistent', phonetic: '/pərˈsɪstənt/', zh: '堅持的；持續的', level: 'Level 4', options: ['堅持的；持續的', '謹慎的；小心的', '有利可圖的', '微小的'] },
  { word: 'vague', phonetic: '/veɪɡ/', zh: '模糊的；不明確的', level: 'Level 4', options: ['模糊的；不明確的', '有價值的', '廣泛的', '嚴格的'] },
  { word: 'urgent', phonetic: '/ˈɜːrdʒənt/', zh: '緊急的；急迫的', level: 'Level 3', options: ['緊急的；急迫的', '慷慨的；寬大的', '頻繁的；經常的', '必要的；本質的'] },
  { word: 'curious', phonetic: '/ˈkjʊriəs/', zh: '好奇的；求知的', level: 'Level 2', options: ['好奇的；求知的', '勤奮的；用功的', '獨特的；唯一的', '大量的；充裕的'] }
];
const vocabulary = (window.VOCABULARY_6000 || []).map(item => ({ word: item.Word.toLowerCase(), level: `Level ${item.Level}`, partOfSpeech: item.PartsOfSpeech.join(' ') }));
const wordIndex = new Map(vocabulary.map(item => [item.word, item]));
const CACHE_KEY = 'word-sprint-dictionary-cache-v1';
const SAVED_KEY = 'word-sprint-personal-words-v1';
const DAILY_SCORE_KEY = 'word-sprint-daily-score-v1';
const DAILY_BEST_KEY = 'word-sprint-daily-best-v1';
const NICKNAME_KEY = 'word-sprint-nickname-v1';
const DAILY_STATS_KEY = 'word-sprint-daily-stats-v1';
const STREAK_KEY = 'word-sprint-streak-v1';
const XP_KEY = 'word-sprint-total-xp-v1';
const PLAYER_LEVEL_KEY = 'word-sprint-player-level-v1';
const PLACEMENT_KEY = 'word-sprint-placement-complete-v1';
const PERSONAL_LIBRARY_KEY = 'word-sprint-library-v1';
const WORD_GROUPS_KEY = 'word-sprint-word-groups-v1';
const PRACTICE_XP = 100;
let dictionaryCache = loadStore(CACHE_KEY), savedWords = loadStore(SAVED_KEY), personalLibrary = loadStore(PERSONAL_LIBRARY_KEY), wordGroups = loadStore(WORD_GROUPS_KEY), activeCollection = 'all', dailyBest = loadDailyBest(), dailyScore = dailyBest.score, dailyStats = loadDailyStats(), totalXp = Number(localStorage.getItem(XP_KEY)) || 0, playerNickname = localStorage.getItem(NICKNAME_KEY) || '', playerLevel = localStorage.getItem(PLAYER_LEVEL_KEY) || 'lv1', currentWord = '', practiceMode = 'choice', index = 0, roundScore = 0, locked = false, roundActive = false;
const modeState = { choice: { index: 0, roundScore: 0, active: false }, spelling: { index: 0, roundScore: 0, active: false } };
const roundStartedAt = { choice: null, spelling: null };
let roundWords = [];
let placementState = { index: 0, score: 0, words: [] };
const $ = selector => document.querySelector(selector);

function loadStore(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } }
function saveStore(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
if (!personalLibrary || Array.isArray(personalLibrary)) personalLibrary = {};
if (!Array.isArray(wordGroups)) wordGroups = [];
Object.keys(savedWords).forEach(word => ensurePersonalWord(word));
function todayKey() { return new Date().toLocaleDateString('sv-SE'); }
function loadDailyScore() { const saved = loadStore(DAILY_SCORE_KEY); return saved.date === todayKey() && Number.isFinite(saved.score) ? saved.score : 0; }
function saveDailyScore() { saveStore(DAILY_SCORE_KEY, { date: todayKey(), score: dailyScore }); }
function loadDailyBest() { const saved = loadStore(DAILY_BEST_KEY); return saved.date === todayKey() && Number.isFinite(saved.score) ? { date: todayKey(), score: saved.score, elapsedSeconds: Number.isFinite(saved.elapsedSeconds) ? saved.elapsedSeconds : Number.POSITIVE_INFINITY } : { date: todayKey(), score: 0, elapsedSeconds: Number.POSITIVE_INFINITY }; }
function recordDailyBest(score, elapsedSeconds) { if (score < dailyBest.score || (score === dailyBest.score && elapsedSeconds >= dailyBest.elapsedSeconds)) return; dailyBest = { date: todayKey(), score, elapsedSeconds }; dailyScore = score; saveStore(DAILY_BEST_KEY, dailyBest); renderLeaderboard(); }
function loadDailyStats() { const saved = loadStore(DAILY_STATS_KEY); return saved.date === todayKey() ? { date: todayKey(), correct: Number(saved.correct) || 0, attempted: Number(saved.attempted) || 0 } : { date: todayKey(), correct: 0, attempted: 0 }; }
function saveDailyStats() { saveStore(DAILY_STATS_KEY, dailyStats); }
function markPracticeDay() { const saved = loadStore(STREAK_KEY); const today = todayKey(); if (saved.lastDate === today) return Number(saved.count) || 1; const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); const count = saved.lastDate === yesterday.toLocaleDateString('sv-SE') ? (Number(saved.count) || 0) + 1 : 1; saveStore(STREAK_KEY, { lastDate: today, count }); return count; }
function updateStats() { const streak = loadStore(STREAK_KEY); const hasRank = dailyStats.correct > 0 && playerNickname; $('#streakValue').textContent = streak.lastDate ? streak.count : 0; $('#learnedValue').textContent = dailyStats.correct; $('#accuracyValue').textContent = dailyStats.attempted ? `${Math.round((dailyStats.correct / dailyStats.attempted) * 100)}%` : '0%'; $('#dailyRankValue').textContent = hasRank ? '#1' : '—'; }
function recordAttempt(correct) { updateQuizTime(); markPracticeDay(); dailyStats.attempted += 1; if (correct) dailyStats.correct += 1; saveDailyStats(); updateStats(); }
function getLevelInfo() { let level = 1, remainingXp = totalXp, requiredXp = 1000; while (remainingXp >= requiredXp) { remainingXp -= requiredXp; level += 1; requiredXp += 500; } return { level, remainingXp, requiredXp }; }
function updateXp() { const info = getLevelInfo(); $('#xpLevel').textContent = `LV${info.level}`; $('#xpText').textContent = `${info.remainingXp.toLocaleString()} / ${info.requiredXp.toLocaleString()} XP`; $('#xpProgress').style.width = `${(info.remainingXp / info.requiredXp) * 100}%`; }
function grantPracticeXp(multiplier = 1) { const earnedXp = Math.round(PRACTICE_XP * multiplier); totalXp += earnedXp; localStorage.setItem(XP_KEY, String(totalXp)); updateXp(); return earnedXp; }
function getElapsedSeconds() { return Math.max(0, Math.floor((Date.now() - (roundStartedAt[practiceMode] || Date.now())) / 1000)); }
function updateQuizTime() { if (!roundActive || $('#nextQuestion')?.dataset.complete === 'true') return; $('#quizTime').textContent = `⏱ ${formatDuration(getElapsedSeconds())}`; }
function getTimeMultiplier() { const elapsedSeconds = getElapsedSeconds(); if (elapsedSeconds <= 90) return { multiplier: 2, stars: '★★★', elapsedSeconds }; if (elapsedSeconds <= 150) return { multiplier: 1.5, stars: '★★', elapsedSeconds }; return { multiplier: 1, stars: '★', elapsedSeconds }; }
function formatDuration(seconds) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
function applyCompletionBonus() { const timing = getTimeMultiplier(); const accuracy = Math.round(roundScore); const eligibleForBonus = accuracy >= 70; const multiplier = eligibleForBonus ? timing.multiplier : 1; return { ...timing, multiplier, accuracy, eligibleForBonus, finalScore: roundScore }; }
function initials(name) { return [...name].slice(0, 1).join('').toUpperCase() || '?'; }
function updatePlayerIdentity() { $('#playerAvatar').textContent = initials(playerNickname); $('#playerLevelName').textContent = playerLevelLabel(); }
function openNicknameModal() { $('#nicknameInput').value = playerNickname; $('#nicknameModal').classList.add('open'); setTimeout(() => $('#nicknameInput').focus(), 0); }
function saveNickname(event) { event.preventDefault(); const input = $('#nicknameInput'); input.setCustomValidity(''); const name = input.value.replace(/[<>]/g, '').trim().slice(0, 12); if (!name) { input.setCustomValidity('請輸入暱稱'); input.reportValidity(); return; } playerNickname = name; localStorage.setItem(NICKNAME_KEY, playerNickname); $('#nicknameModal').classList.remove('open'); updatePlayerIdentity(); renderLeaderboard(); updateStats(); if (!localStorage.getItem(PLACEMENT_KEY)) openPlacementAssessment(); }
function getPlacementLevel(score) { return score <= 3 ? 'lv1' : score <= 6 ? 'lv2' : 'lv3'; }
function playerLevelLabel(level = playerLevel) { return level === 'lv3' ? '單字高手' : level === 'lv2' ? '穩步進階' : '單字新手'; }
function openPlacementAssessment() { placementState = { index: 0, score: 0, words: shuffle(quizWords).slice(0, 10) }; $('#placementModal').classList.add('open'); renderPlacementQuestion(); }
function renderPlacementQuestion() { const state = placementState; if (state.index >= 10) { const level = getPlacementLevel(state.score); playerLevel = level; localStorage.setItem(PLAYER_LEVEL_KEY, level); localStorage.setItem(PLACEMENT_KEY, 'true'); updatePlayerIdentity(); $('#placementProgress').textContent = '已完成分級。'; $('#placementContent').innerHTML = `<div class="placement-result"><b>${playerLevelLabel(level)}</b>答對 ${state.score} / 10 題。每日練習會依此難度補足單字。<button class="primary-button" id="finishPlacement">開始學習 <span>→</span></button></div>`; $('#finishPlacement').onclick = () => $('#placementModal').classList.remove('open'); return; }
  const entry = state.words[state.index]; const isChoice = state.index < 5; $('#placementProgress').textContent = `第 ${state.index + 1} / 10 題 · ${isChoice ? '選擇題' : '填字題'} · ${entry.level}`;
  if (isChoice) { $('#placementContent').innerHTML = `<div class="placement-question"><p class="placement-word">${escapeHtml(entry.word)}</p><p class="placement-prompt">請選出最接近的中文意思</p><div class="placement-options">${shuffle(entry.options).map(option => `<button data-placement-answer="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join('')}</div></div>`; $('#placementContent').querySelectorAll('[data-placement-answer]').forEach(button => button.onclick = () => { const correct = button.dataset.placementAnswer === entry.zh; $('#placementContent').querySelectorAll('button').forEach(item => { item.disabled = true; if (item.dataset.placementAnswer === entry.zh) item.classList.add('correct'); }); if (!correct) button.classList.add('wrong'); advancePlacement(correct); }); return; }
  $('#placementContent').innerHTML = `<form class="placement-question" id="placementForm"><p class="placement-prompt">中文提示：${escapeHtml(entry.zh)}</p><input class="placement-input" id="placementInput" autocomplete="off" autocapitalize="none" placeholder="填入英文單字" required><button class="primary-button" type="submit">確認 <span>→</span></button></form>`; $('#placementForm').onsubmit = event => { event.preventDefault(); const correct = $('#placementInput').value.trim().toLowerCase() === entry.word; $('#placementInput').disabled = true; advancePlacement(correct); };
}
function advancePlacement(correct) { if (correct) placementState.score += 1; setTimeout(renderPlacementQuestion, 450); placementState.index += 1; }
function speak(text) { if ('speechSynthesis' in window) { speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'en-US'; utterance.rate = .82; speechSynthesis.speak(utterance); } }
function shuffle(list) { return [...list].sort(() => Math.random() - .5); }
function setSearchStatus(message, type = '') { const status = $('#searchStatus'); status.textContent = message; status.className = `search-status ${type}`; }
function escapeHtml(text = '') { const el = document.createElement('div'); el.textContent = text; return el.innerHTML; }
function normalizeWord(value) { return value.trim().toLowerCase().replace(/[^a-z.'-]/g, ''); }

function renderQuiz() {
  if (!roundActive) { $('#roundStartPanel').hidden = false; $('#quizCard').hidden = true; $('#nextQuestion').hidden = true; $('#quizProgress').style.width = '0'; $('#quizTime').textContent = '⏱ 0:00'; return; }
  $('#roundStartPanel').hidden = true; $('#quizCard').hidden = false; $('#nextQuestion').hidden = false;
  const entry = roundWords[index] || quizWords[index % quizWords.length]; locked = false;
  delete $('#nextQuestion').dataset.complete; $('#nextQuestion').innerHTML = '下一題 <span>→</span>';
  $('#questionNumber').textContent = String(index + 1).padStart(2, '0'); $('#wordLevel').textContent = entry.level;
  $('#quizScore').textContent = `${roundScore} / 100 分`; updateQuizTime();
  $('#quizWord').textContent = practiceMode === 'choice' ? entry.word : '填入正確單字'; $('#quizPhonetic').textContent = practiceMode === 'choice' ? entry.phonetic : '可按右上角按鈕聽發音'; $('#quizMessage').textContent = '';
  $('.question-label').textContent = practiceMode === 'choice' ? '這個字最接近哪個意思？' : `中文提示：${entry.zh}`;
  $('#quizProgress').style.width = `${(index / 10) * 100}%`;
  const answers = $('#answers'); answers.innerHTML = '';
  if (practiceMode === 'choice') {
    shuffle(entry.options).forEach(option => { const button = document.createElement('button'); button.className = 'answer'; button.textContent = option; button.onclick = () => answer(option, entry, button); answers.append(button); });
  } else {
    answers.innerHTML = `<div class="letter-cells">${entry.word.split('').map((_, cellIndex) => `<input class="letter-cell" data-cell="${cellIndex}" maxlength="1" inputmode="text" autocomplete="off" autocapitalize="none" aria-label="第 ${cellIndex + 1} 個字母">`).join('')}</div><p class="spelling-hint">共 ${entry.word.length} 個字母，輸入後會自動跳到下一格。</p><div class="spelling-form"><button class="spelling-check" id="checkSpelling">檢查答案</button></div>`;
    const cells = [...document.querySelectorAll('.letter-cell')]; cells.forEach((cell, cellIndex) => { cell.addEventListener('input', () => { cell.value = cell.value.replace(/[^a-z]/gi, '').slice(-1).toLowerCase(); if (cell.value) cells[cellIndex + 1]?.focus(); }); cell.addEventListener('keydown', event => { if (event.key === 'Backspace' && !cell.value) cells[cellIndex - 1]?.focus(); if (event.key === 'Enter') checkSpelling(entry); }); }); $('#checkSpelling').onclick = () => checkSpelling(entry); setTimeout(() => cells[0]?.focus(), 0);
  }
}
function saveModeState() { modeState[practiceMode] = { index, roundScore, active: roundActive }; }
function awardPoint() { roundScore += 10; saveModeState(); $('#quizScore').textContent = `${roundScore} / 100 分`; updateStats(); }
function answer(choice, entry, button) { if (locked) return; locked = true; const correct = choice === entry.zh; button.classList.add(correct ? 'correct' : 'wrong'); if (!correct) [...document.querySelectorAll('.answer')].find(b => b.textContent === entry.zh)?.classList.add('correct'); recordAttempt(correct); $('#quizMessage').textContent = correct ? '答對了！+10 分' : `答案是「${entry.zh}」`; if (correct) awardPoint(); }
function checkSpelling(entry) { if (locked) return; const cells = [...document.querySelectorAll('.letter-cell')]; if (cells.some(cell => !cell.value)) { $('#quizMessage').textContent = '請填完所有字母格。'; return; } const typedWord = cells.map(cell => cell.value).join(''); const correct = typedWord === entry.word; locked = true; cells.forEach(cell => { cell.disabled = true; cell.style.borderColor = correct ? '#b8df60' : '#ffb8c7'; }); $('#checkSpelling').disabled = true; recordAttempt(correct); $('#quizMessage').textContent = correct ? '拼對了！+10 分，再按一次下一題繼續。' : `正確拼字是「${entry.word}」，再按一次下一題繼續。`; if (correct) awardPoint(); }
function reveal(entry) { locked = true; [...document.querySelectorAll('.answer')].find(button => button.textContent === entry.zh)?.classList.add('correct'); $('#quizMessage').textContent = `正確答案是「${entry.word}」。`; }
function finishRound() { locked = true; const result = applyCompletionBonus(); updateQuizTime(); roundActive = false; recordDailyBest(result.finalScore, result.elapsedSeconds); const earnedXp = grantPracticeXp(result.multiplier); saveModeState(); $('#questionNumber').textContent = '10'; $('#quizProgress').style.width = '100%'; $('#quizScore').textContent = `${result.finalScore} 分`; $('#quizWord').textContent = '本回合完成！'; $('#quizPhonetic').textContent = ''; $('.question-label').textContent = `共 10 題 · 每題 10 分 · 完成時間 ${formatDuration(result.elapsedSeconds)}`; $('#answers').innerHTML = `<div class="round-result"><b>${result.stars}　${result.finalScore} 分</b><span>${result.stars} 速度評價 · ${result.eligibleForBonus ? (result.multiplier > 1 ? `答對率 ${result.accuracy}% ，XP 加成 ×${result.multiplier}！` : `答對率 ${result.accuracy}% ，獲得基本 XP。`) : `答對率 ${result.accuracy}% 未達 70%，不套用 XP 加成。`} 完成每日練習，獲得 ${earnedXp} XP。</span></div>`; $('#quizMessage').textContent = ''; $('#nextQuestion').dataset.complete = 'true'; $('#nextQuestion').innerHTML = '再玩一次 <span>↻</span>'; }
function nextLearningQuestion() { if ($('#nextQuestion').dataset.complete === 'true') { index = 0; roundScore = 0; roundStartedAt[practiceMode] = null; roundActive = false; saveModeState(); delete $('#nextQuestion').dataset.complete; renderQuiz(); return; } if (!locked) { if (practiceMode === 'spelling') { const cells = [...document.querySelectorAll('.letter-cell')]; if (cells.length && cells.every(cell => cell.value)) { checkSpelling(roundWords[index] || quizWords[index]); return; } $('#quizMessage').textContent = '請先填完所有字母格。'; return; } $('#quizMessage').textContent = '請先選擇一個答案。'; return; } if (index === 9) { finishRound(); return; } index += 1; saveModeState(); renderQuiz(); }
function getLibraryQuizEntries() { return shuffle(Object.keys(personalLibrary).map(word => dictionaryCache[word]).filter(entry => entry?.word && entry.zhMeaning && entry.zhMeaning !== '中文翻譯暫時不可用')); }
function getDifficultyRange() { return playerLevel === 'lv3' ? [5, 6] : playerLevel === 'lv2' ? [3, 4] : [1, 2]; }
function toQuizWords(entries) { return entries.slice(0, 10).map(entry => { const incorrectMeanings = shuffle(entries.filter(candidate => candidate.word !== entry.word && candidate.zhMeaning !== entry.zhMeaning).map(candidate => candidate.zhMeaning)).slice(0, 3); return { word: entry.word, phonetic: entry.phonetic || '—', zh: entry.zhMeaning, level: entry.level || '表外單字', options: shuffle([entry.zhMeaning, ...incorrectMeanings]) }; }); }
async function supplementQuizEntries(entries) {
  const [minimum, maximum] = getDifficultyRange(); const included = new Set(entries.map(entry => entry.word)); const pool = shuffle(vocabulary.filter(item => { const level = Number(item.level.replace('Level ', '')); return level >= minimum && level <= maximum && !included.has(item.word) && /^[a-z]+$/.test(item.word); }));
  while (entries.length < 10 && pool.length) {
    const batch = pool.splice(0, Math.min(6, pool.length)); const fetched = await Promise.all(batch.map(async item => { try { const entry = dictionaryCache[item.word] || await fetchWord(item.word); if (entry?.zhMeaning && entry.zhMeaning !== '中文翻譯暫時不可用') { dictionaryCache[item.word] = entry; return entry; } } catch {} return null; }));
    fetched.filter(Boolean).forEach(entry => { if (!included.has(entry.word) && entries.length < 10) { entries.push(entry); included.add(entry.word); } });
  }
  saveStore(CACHE_KEY, dictionaryCache); return entries;
}
function setQuizLoading(active, message = '') { $('#quizLoadingText').textContent = message || '正在從 6000 單字取得詞義，請稍候。'; $('#quizLoading').classList.toggle('open', active); }
async function startRound() { const button = $('#startRound'); if (button.disabled) return; button.disabled = true; const entries = getLibraryQuizEntries().slice(0, 10); const missing = Math.max(0, 10 - entries.length); try { if (missing) { const message = `正在依「${playerLevelLabel()}」難度補足 ${missing} 題，準備完成後會自動開始練習。`; $('#startRoundInfo').textContent = message; setQuizLoading(true, message); await supplementQuizEntries(entries); } if (entries.length < 10) { $('#startRoundInfo').textContent = '免費字典暫時無法取得足夠詞義，請確認網路後再試。'; return; } index = 0; roundScore = 0; roundWords = toQuizWords(entries); roundStartedAt[practiceMode] = Date.now(); roundActive = true; saveModeState(); renderQuiz(); } finally { button.disabled = false; setQuizLoading(false); } }

function findLookalikes(word) {
  const candidates = vocabulary.filter(item => item.word !== word && Math.abs(item.word.length - word.length) <= 2);
  return candidates.map(item => ({ ...item, score: editDistance(word, item.word) })).filter(item => item.score > 0 && item.score <= Math.max(2, Math.floor(word.length / 3))).sort((a, b) => a.score - b.score || a.word.localeCompare(b.word)).slice(0, 5).map(item => item.word);
}
function editDistance(a, b) { const row = Array.from({ length: b.length + 1 }, (_, i) => i); for (let i = 1; i <= a.length; i++) { let previous = row[0]; row[0] = i; for (let j = 1; j <= b.length; j++) { const old = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1)); previous = old; } } return row[b.length]; }
function flattenDictionaryData(data) {
  const meanings = data.flatMap(entry => entry.meanings || []).sort((a, b) => (a.partOfSpeech === 'noun' ? -1 : 0) - (b.partOfSpeech === 'noun' ? -1 : 0));
  const definitions = meanings.flatMap(meaning => (meaning.definitions || []).slice(0, 2).map(definition => definition.definition)).filter(Boolean).slice(0, 3);
  const synonyms = [...new Set(meanings.flatMap(meaning => [...(meaning.synonyms || []), ...(meaning.definitions || []).flatMap(definition => definition.synonyms || [])]))].slice(0, 8);
  const phoneticEntry = data.flatMap(entry => entry.phonetics || []).find(item => item.audio || item.text) || {};
  return { phonetic: data.find(entry => entry.phonetic)?.phonetic || phoneticEntry.text || '—', audioUrl: phoneticEntry.audio ? (phoneticEntry.audio.startsWith('//') ? `https:${phoneticEntry.audio}` : phoneticEntry.audio) : '', definitions, synonyms };
}
async function translateText(text) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en%7Czh-TW`;
  try { const payload = await requestJson(url, 6000); return payload.responseData?.translatedText || ''; } catch { return ''; }
}
async function requestJson(url, timeout = 8000) {
  const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), timeout);
  try { const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } }); if (!response.ok) throw new Error(`request-${response.status}`); return await response.json(); }
  finally { clearTimeout(timeoutId); }
}
function flattenWordSoHard(data) {
  return { phonetic: data.phonetic || '—', audioUrl: '', definitions: (data.definitions || []).map(item => item.definition).filter(Boolean).slice(0, 3), synonyms: [] };
}
async function fetchWord(word) {
  const sourceWord = wordIndex.get(word); let english, partOfSpeech, provider;
  try {
    const data = await requestJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    english = flattenDictionaryData(data); partOfSpeech = (data[0]?.meanings || []).map(item => item.partOfSpeech).filter(Boolean).join('、'); provider = 'Free Dictionary API';
  } catch (primaryError) {
    try {
      const fallback = await requestJson(`https://wordsohard.com/api/v1/define/${encodeURIComponent(word)}`);
      if (!fallback.found) { const error = new Error('not-found'); error.code = 'not-found'; throw error; }
      english = flattenWordSoHard(fallback); partOfSpeech = fallback.partOfSpeech || '—'; provider = 'WordSoHard Dictionary（備援）';
    } catch (fallbackError) {
      if (fallbackError.code === 'not-found') throw fallbackError;
      throw primaryError;
    }
  }
  const zhMeaning = await translateText(english.definitions[0] || word);
  return { word, level: sourceWord?.level || '表外單字', partOfSpeech: sourceWord?.partOfSpeech || partOfSpeech || '—', ...english, zhMeaning: zhMeaning || '中文翻譯暫時不可用', lookalikes: findLookalikes(word), source: sourceWord ? `高中英文參考詞彙表 + ${provider}` : provider, cachedAt: new Date().toISOString() };
}
function renderDetail(entry) {
  const detail = $('#wordDetail'); detail.classList.remove('empty');
  const definitionList = entry.definitions?.length ? entry.definitions.map(item => `<li>${escapeHtml(item)}</li>`).join('') : '<li>英文定義暫時不可用</li>';
  const chips = items => items?.length ? items.map(item => `<span>${escapeHtml(item)}</span>`).join('') : '<span>—</span>';
  detail.innerHTML = `<div class="detail-top"><div><h3>${escapeHtml(entry.word)}</h3><p>${escapeHtml(entry.phonetic || '—')} · ${escapeHtml(entry.level)} · ${escapeHtml(entry.partOfSpeech)}</p></div><button class="detail-sound" aria-label="朗讀 ${escapeHtml(entry.word)}">⌁</button></div><p class="meaning">${escapeHtml(entry.zhMeaning || '中文翻譯暫時不可用')}</p><p class="machine-note">中文釋義為機器翻譯，請以英文原文為準。</p><p class="detail-label">ENGLISH DEFINITIONS · 英文釋義</p><ol class="definitions">${definitionList}</ol><hr><p class="detail-label">SYNONYMS · 同義字</p><div class="chips">${chips(entry.synonyms)}</div><hr><p class="detail-label">LOOK-ALIKE WORDS · 形近字</p><div class="chips lookalikes">${chips(entry.lookalikes)}</div><p class="detail-source">${escapeHtml(entry.source)} · ${entry.cachedAt ? `已快取 ${new Date(entry.cachedAt).toLocaleDateString('zh-TW')}` : ''}</p>`;
  detail.querySelector('button').onclick = () => entry.audioUrl ? new Audio(entry.audioUrl).play().catch(() => speak(entry.word)) : speak(entry.word);
}
function renderEmpty(title, message) { $('#wordDetail').className = 'word-detail empty'; $('#wordDetail').innerHTML = `<div class="detail-empty-icon">?</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p>`; }
function renderSuggestions(query = '') {
  const normalized = normalizeWord(query); const candidates = normalized ? vocabulary.filter(item => item.word.startsWith(normalized)).slice(0, 7) : ['glass', 'abundant', 'cautious', 'diligent'];
  $('#suggestionChips').innerHTML = candidates.map(item => { const word = typeof item === 'string' ? item : item.word; const level = typeof item === 'string' ? '' : ` · ${item.level}`; return `<button data-word="${escapeHtml(word)}">${escapeHtml(word)}${level}</button>`; }).join('');
  document.querySelectorAll('#suggestionChips button').forEach(button => button.onclick = () => { $('#wordSearch').value = button.dataset.word; lookupWord(button.dataset.word); });
}
async function lookupWord(rawWord, force = false) {
  const word = normalizeWord(rawWord); if (!word) { setSearchStatus('請輸入英文單字。'); renderEmpty('探索一個單字', '輸入英文單字，查詢中文意思、同義字與形近字。'); return; }
  currentWord = word;
  renderSuggestions(word);
  if (!force && dictionaryCache[word]) { renderDetail(dictionaryCache[word]); setSearchStatus('已從本機快取載入。', 'success'); return; }
  setSearchStatus(`正在查詢「${word}」…`, 'loading'); renderEmpty('正在查詢', '正在取得英文解釋、中文意思與發音資料。');
  try { const entry = await fetchWord(word); dictionaryCache[word] = entry; savedWords[word] = { word, savedAt: entry.cachedAt }; ensurePersonalWord(word); saveStore(CACHE_KEY, dictionaryCache); saveStore(SAVED_KEY, savedWords); updateSavedCount(); renderDetail(entry); setSearchStatus(wordIndex.has(word) ? '已查到高中 6000 字表單字，詳細資料已快取。' : '已查到表外單字，並新增至你的個人詞庫。', 'success'); }
  catch (error) { if (error.code === 'not-found') { renderEmpty('尚未找到這個字', 'Free Dictionary API 中沒有這筆英文單字。請檢查拼字後再試。'); setSearchStatus('找不到單字。', 'error'); } else { renderEmpty('目前無法連線', '請確認網路後重試；已快取的單字仍可離線查看。'); setSearchStatus('線上字典暫時無法連線。', 'error'); } }
}
function updateSavedCount() { $('#savedCount').textContent = Object.keys(savedWords).length; }
function ensurePersonalWord(word) { if (!personalLibrary[word]) { personalLibrary[word] = { rating: 3, groups: [] }; saveStore(PERSONAL_LIBRARY_KEY, personalLibrary); } }
function renderLibrary() {
  const allWords = Object.keys(personalLibrary).sort((a, b) => a.localeCompare(b));
  const selectedWords = activeCollection === 'all' ? allWords : allWords.filter(word => personalLibrary[word].groups?.includes(activeCollection));
  $('#libraryCount').textContent = allWords.length;
  $('#collectionTabs').innerHTML = [`<button class="${activeCollection === 'all' ? 'active' : ''}" data-collection="all">全部 ${allWords.length}</button>`, ...wordGroups.map(group => `<button class="${activeCollection === group.id ? 'active' : ''}" data-collection="${escapeHtml(group.id)}">${escapeHtml(group.name)}</button>`)].join('');
  $('#collectionTabs').querySelectorAll('button').forEach(button => button.onclick = () => { activeCollection = button.dataset.collection; renderLibrary(); });
  const group = wordGroups.find(item => item.id === activeCollection);
  const availableToAdd = group ? allWords.filter(word => !personalLibrary[word].groups?.includes(group.id)) : [];
  const groupPicker = group ? `<div class="collection-add"><span>加入「${escapeHtml(group.name)}」</span><select id="groupWordPicker" aria-label="選取要加入組合的單字"><option value="">選取詞庫單字</option>${availableToAdd.map(word => `<option value="${escapeHtml(word)}">${escapeHtml(word)}</option>`).join('')}</select><button class="delete-group" id="deleteGroup">刪除組合</button></div>` : '';
  if (!selectedWords.length) { $('#libraryList').innerHTML = `${groupPicker}<div class="library-empty">${allWords.length ? '這個組合尚未加入單字。' : '尚未有單字。請先在「單字查詢」成功查詢一個單字，它會自動加入這裡。'}</div>`; $('#groupWordPicker')?.addEventListener('change', addWordToActiveGroup); $('#deleteGroup')?.addEventListener('click', deleteActiveGroup); return; }
  $('#libraryList').innerHTML = groupPicker + selectedWords.map(word => {
    const item = personalLibrary[word]; const detail = dictionaryCache[word] || wordIndex.get(word) || {}; const groupChips = (item.groups || []).map(id => wordGroups.find(group => group.id === id)).filter(Boolean).map(group => `<button class="word-group-chip group-remove" data-remove-group="${escapeHtml(group.id)}" data-remove-word="${escapeHtml(word)}" aria-label="將 ${escapeHtml(word)} 從 ${escapeHtml(group.name)} 移除">${escapeHtml(group.name)}</button>`).join('') || '<span class="word-group-chip word-group-none">無</span>';
    const availableGroups = wordGroups.filter(group => !(item.groups || []).includes(group.id));
    const stars = [1, 2, 3, 4, 5].map(star => `<button class="${star <= item.rating ? 'active' : ''}" data-rate-word="${escapeHtml(word)}" data-rating="${star}" aria-label="${star} 顆星">★</button>`).join('');
    const select = availableGroups.length ? `<select class="group-select" data-group-word="${escapeHtml(word)}" aria-label="將 ${escapeHtml(word)} 加入組合"><option value="">加入組合</option>${availableGroups.map(group => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`).join('')}</select>` : '';
    const deleteAction = group ? `<button class="delete-word" data-remove-group="${escapeHtml(group.id)}" data-remove-word="${escapeHtml(word)}">移出組合</button>` : `<button class="delete-word" data-delete-word="${escapeHtml(word)}">刪除單字</button>`;
    return `<article class="library-word"><div class="library-word-top"><div><h3>${escapeHtml(word)}</h3><p>${escapeHtml(detail.zhMeaning || detail.partOfSpeech || '尚未取得詞義')}</p></div><div class="rating-stars" aria-label="重要性評級">${stars}</div></div><div class="library-word-bottom">${groupChips}${select}${deleteAction}</div></article>`;
  }).join('');
  $('#libraryList').querySelectorAll('[data-rate-word]').forEach(button => button.onclick = () => { personalLibrary[button.dataset.rateWord].rating = Number(button.dataset.rating); saveStore(PERSONAL_LIBRARY_KEY, personalLibrary); renderLibrary(); });
  $('#libraryList').querySelectorAll('[data-group-word]').forEach(select => select.onchange = () => { if (!select.value) return; personalLibrary[select.dataset.groupWord].groups.push(select.value); saveStore(PERSONAL_LIBRARY_KEY, personalLibrary); renderLibrary(); });
  $('#libraryList').querySelectorAll('[data-remove-group]').forEach(button => button.onclick = () => removeWordFromGroup(button.dataset.removeWord, button.dataset.removeGroup));
  $('#libraryList').querySelectorAll('[data-delete-word]').forEach(button => button.onclick = () => deletePersonalWord(button.dataset.deleteWord));
  $('#groupWordPicker')?.addEventListener('change', addWordToActiveGroup);
  $('#deleteGroup')?.addEventListener('click', deleteActiveGroup);
}
function addWordToActiveGroup(event) { const word = event.target.value; if (!word || activeCollection === 'all' || !personalLibrary[word]) return; personalLibrary[word].groups = [...new Set([...(personalLibrary[word].groups || []), activeCollection])]; saveStore(PERSONAL_LIBRARY_KEY, personalLibrary); renderLibrary(); }
function removeWordFromGroup(word, groupId) { if (!personalLibrary[word]) return; personalLibrary[word].groups = (personalLibrary[word].groups || []).filter(id => id !== groupId); saveStore(PERSONAL_LIBRARY_KEY, personalLibrary); renderLibrary(); }
function deleteActiveGroup() { const group = wordGroups.find(item => item.id === activeCollection); if (!group || !window.confirm(`確定要刪除「${group.name}」組合嗎？單字會保留在全部詞庫。`)) return; Object.values(personalLibrary).forEach(item => { item.groups = (item.groups || []).filter(id => id !== group.id); }); wordGroups = wordGroups.filter(item => item.id !== group.id); saveStore(PERSONAL_LIBRARY_KEY, personalLibrary); saveStore(WORD_GROUPS_KEY, wordGroups); activeCollection = 'all'; renderLibrary(); }
function deletePersonalWord(word) { if (!personalLibrary[word] || !window.confirm(`確定要刪除單字「${word}」嗎？`)) return; delete personalLibrary[word]; delete savedWords[word]; saveStore(PERSONAL_LIBRARY_KEY, personalLibrary); saveStore(SAVED_KEY, savedWords); updateSavedCount(); renderLibrary(); }
function openGroupForm() { $('#groupForm').hidden = false; $('#openGroupForm').hidden = true; $('#groupName').focus(); }
function createWordGroup(event) { event.preventDefault(); const input = $('#groupName'); const name = input.value.replace(/[<>]/g, '').trim().slice(0, 20); if (!name) return; if (wordGroups.some(group => group.name.toLocaleLowerCase() === name.toLocaleLowerCase())) { input.setCustomValidity('已有相同名稱的組合'); input.reportValidity(); return; } wordGroups.push({ id: `group-${Date.now()}`, name }); saveStore(WORD_GROUPS_KEY, wordGroups); activeCollection = wordGroups[wordGroups.length - 1].id; input.value = ''; input.setCustomValidity(''); $('#groupForm').hidden = true; $('#openGroupForm').hidden = false; renderLibrary(); }
function showSavedWords() { switchScreen('library'); }

function switchScreen(name) { document.querySelectorAll('[data-screen]').forEach(item => item.classList.toggle('active', item.dataset.screen === name)); document.querySelectorAll('.screen').forEach(item => item.classList.toggle('active', item.id === name)); if (name === 'library') renderLibrary(); }
function renderLeaderboard() { const hasScore = dailyBest.score > 0 && playerNickname; $('#dailyScore').textContent = hasScore ? dailyBest.score : 0; $('#rankingCount').textContent = hasScore ? '1 人上榜' : '0 人上榜'; $('#rankingDate').textContent = new Date().toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }); $('#leaderboard').innerHTML = hasScore ? `<div class="rank-row"><span class="rank-number">01</span><span class="rank-avatar">${escapeHtml(initials(playerNickname))}</span><b class="rank-name">${escapeHtml(playerNickname)}</b><span class="rank-score">${dailyBest.score} 分 · ${formatDuration(dailyBest.elapsedSeconds)}</span></div>` : '<p class="leaderboard-empty">完成一回合每日練習，即可登上排行榜！</p>'; }

document.querySelectorAll('[data-screen]').forEach(button => button.addEventListener('click', () => switchScreen(button.dataset.screen))); document.querySelectorAll('[data-practice]').forEach(button => button.addEventListener('click', () => { saveModeState(); practiceMode = button.dataset.practice; ({ index, roundScore, active: roundActive } = modeState[practiceMode]); document.querySelectorAll('[data-practice]').forEach(item => item.classList.toggle('active', item === button)); renderQuiz(); }));
$('#speakQuizWord').onclick = () => speak((roundWords[index] || quizWords[index % quizWords.length]).word); $('#nextQuestion').onclick = nextLearningQuestion;
$('#startRound').onclick = startRound;
$('#startPractice').onclick = () => switchScreen('learn');
$('#playerAvatar').onclick = openNicknameModal; $('#nicknameForm').addEventListener('submit', saveNickname);
$('#groupForm').addEventListener('submit', createWordGroup);
$('#openGroupForm').onclick = openGroupForm;
let searchDelay; $('#wordSearch').addEventListener('input', event => { clearTimeout(searchDelay); renderSuggestions(event.target.value); const word = normalizeWord(event.target.value); if (word.length >= 2) searchDelay = setTimeout(() => lookupWord(word), 550); }); $('#wordSearch').addEventListener('keydown', event => { if (event.key === 'Enter') { clearTimeout(searchDelay); lookupWord(event.target.value); } });
$('#clearCache').onclick = () => { dictionaryCache = {}; localStorage.removeItem(CACHE_KEY); setSearchStatus('已清除詞典快取；個人新增單字清單仍會保留。', 'success'); }; $('#refreshWord').onclick = () => currentWord ? lookupWord(currentWord, true) : setSearchStatus('請先查詢一個單字。'); $('#showSaved').onclick = showSavedWords;
$('#vocabCount').textContent = vocabulary.length.toLocaleString(); updatePlayerIdentity(); updateStats(); updateXp(); renderSuggestions(); updateSavedCount(); renderQuiz(); renderLeaderboard(); renderLibrary(); setInterval(updateQuizTime, 1000); if (!playerNickname) openNicknameModal(); else if (!localStorage.getItem(PLACEMENT_KEY)) openPlacementAssessment();

